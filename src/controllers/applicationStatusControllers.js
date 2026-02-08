const { db } = require('../lib/db');
const { applicationStatus } = require('../lib/schema/applicationStatus');
const { applicationSla } = require('../lib/schema/applicationSLA');
const { creditApplication } = require('../lib/schema/creditApplication');
const { users } = require('../lib/schema/users');
const { eq, desc, asc, and } = require('drizzle-orm');

/**
 * HELPER: Calculate SLA
 */
const calculateSLA = async (applicationId, newStatus, transaction = null) => {
  try {
    const dbClient = transaction || db;

    // Ambil status terakhir sebelum perubahan
    const lastStatusResult = await dbClient
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.applicationId, applicationId))
      .orderBy(desc(applicationStatus.createdAt))
      .limit(1);

    const lastStatus = lastStatusResult[0];

    if (!lastStatus) {
      console.log('Status pertama, tidak perlu tracking SLA');
      return null;
    }

    // Cek apakah status benar-benar berubah
    if (lastStatus.status === newStatus) {
      console.log('Status tidak berubah, skip SLA tracking');
      return null;
    }

    // Hitung durasi dari status sebelumnya ke status baru
    const startTime = new Date(lastStatus.createdAt);
    const endTime = new Date();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    // Validasi durasi tidak negatif
    if (durationMinutes < 0) {
      console.error('ERROR: Duration negatif!', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      return null;
    }

    // Simpan ke tabel ApplicationSLA
    const slaRecordResult = await dbClient
      .insert(applicationSla)
      .values({
        applicationId,
        fromStatus: lastStatus.status,
        toStatus: newStatus,
        startTime,
        endTime,
        durationMinutes,
        catatan: `Transisi dari ${lastStatus.status} ke ${newStatus}`,
      })
      .returning();

    const slaRecord = slaRecordResult[0];

    console.log('SLA tracked successfully:', {
      application_id: applicationId,
      from: lastStatus.status,
      to: newStatus,
      duration: durationMinutes,
    });

    return {
      from: lastStatus.status,
      to: newStatus,
      duration: durationMinutes,
      sla_id: slaRecord.id,
    };
  } catch (error) {
    console.error('ERROR CALCULATE SLA:', {
      applicationId,
      newStatus,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * GET ALL STATUS
 */
const getAllStatus = async (req, res) => {
  try {
    const data = await db
      .select({
        id: applicationStatus.id,
        application_id: applicationStatus.applicationId,
        status: applicationStatus.status,
        catatan: applicationStatus.catatan,
        changed_by: applicationStatus.changedBy,
        created_at: applicationStatus.createdAt,
        application: {
          kode_pengajuan: creditApplication.kodePengajuan,
          nama_lengkap: creditApplication.namaLengkap,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(applicationStatus)
      .leftJoin(
        creditApplication,
        eq(applicationStatus.applicationId, creditApplication.id)
      )
      .leftJoin(users, eq(applicationStatus.changedBy, users.id))
      .orderBy(desc(applicationStatus.createdAt));

    return res.status(200).json({
      success: true,
      message: 'Data status pengajuan berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error in get all status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET STATUS BY APPLICATION
 */
const getStatusByApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID aplikasi tidak valid',
      });
    }

    const applicationId = Number(id);

    // Cek apakah aplikasi exists
    const applicationExists = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.id, applicationId))
      .limit(1);

    if (applicationExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan',
      });
    }

    // Jika bukan ADMIN, cek kepemilikan
    if (req.user.role_name !== 'Admin') {
      if (applicationExists[0].userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke pengajuan ini',
        });
      }
    }

    const data = await db
      .select({
        id: applicationStatus.id,
        application_id: applicationStatus.applicationId,
        status: applicationStatus.status,
        catatan: applicationStatus.catatan,
        changed_by: applicationStatus.changedBy,
        created_at: applicationStatus.createdAt,
        user: {
          name: users.name,
          email: users.email,
        },
      })
      .from(applicationStatus)
      .leftJoin(users, eq(applicationStatus.changedBy, users.id))
      .where(eq(applicationStatus.applicationId, applicationId))
      .orderBy(desc(applicationStatus.createdAt));

    return res.status(200).json({
      success: true,
      message: 'Data status pengajuan berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error in get status by application:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * CREATE STATUS (ADMIN) - Dengan SLA Tracking
 */
const createStatus = async (req, res) => {
  try {
    const { application_id, status, catatan } = req.body;

    // Validasi input
    if (!application_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'application_id dan status wajib diisi',
      });
    }

    // Validasi application_id adalah number
    if (isNaN(Number(application_id))) {
      return res.status(400).json({
        success: false,
        message: 'application_id harus berupa angka',
      });
    }

    // Validasi status enum
    const validStatuses = ['DIAJUKAN', 'DIPROSES', 'DITERIMA', 'DITOLAK'];
    const upperStatus = status.toUpperCase();

    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status harus salah satu dari: ${validStatuses.join(', ')}`,
      });
    }

    // Cek application exists
    const applicationResult = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.id, Number(application_id)))
      .limit(1);

    if (applicationResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan',
      });
    }

    // Cek user exists
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    // Transaction untuk create status dan hitung SLA
    const result = await db.transaction(async (tx) => {
      // Hitung SLA SEBELUM membuat status baru
      const slaInfo = await calculateSLA(
        Number(application_id),
        upperStatus,
        tx
      );

      // Buat status baru
      const newStatusResult = await tx
        .insert(applicationStatus)
        .values({
          applicationId: Number(application_id),
          status: upperStatus,
          catatan: catatan || `Status diubah menjadi ${upperStatus}`,
          changedBy: req.user.id,
        })
        .returning();

      const newStatus = newStatusResult[0];

      // Ambil data user untuk response
      const userDataResult = await tx
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      return {
        newStatus: {
          ...newStatus,
          user: userDataResult[0],
        },
        slaInfo,
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Status pengajuan berhasil ditambahkan',
      data: result.newStatus,
      sla: result.slaInfo,
    });
  } catch (error) {
    console.error('Error in create status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * UPDATE STATUS
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID status tidak valid',
      });
    }

    const statusId = Number(id);

    // Validasi input
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status wajib diisi',
      });
    }

    // Validasi status enum
    const validStatuses = ['DIAJUKAN', 'DIPROSES', 'DITERIMA', 'DITOLAK'];
    const upperStatus = status.toUpperCase();

    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status harus salah satu dari: ${validStatuses.join(', ')}`,
      });
    }

    // Mengambil status yang akan diupdate
    const existingStatusResult = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.id, statusId))
      .limit(1);

    if (existingStatusResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Status tidak ditemukan',
      });
    }

    const existingStatus = existingStatusResult[0];

    // Transaction untuk update status dan hitung SLA
    const result = await db.transaction(async (tx) => {
      let slaInfo = null;

      // Hitung SLA HANYA jika status berubah
      if (existingStatus.status !== upperStatus) {
        slaInfo = await calculateSLA(
          existingStatus.applicationId,
          upperStatus,
          tx
        );
      }

      // Update status
      const updatedStatusResult = await tx
        .update(applicationStatus)
        .set({
          status: upperStatus,
          catatan: catatan || existingStatus.catatan,
          changedBy: req.user.id,
        })
        .where(eq(applicationStatus.id, statusId))
        .returning();

      const updatedStatus = updatedStatusResult[0];

      // Ambil data user untuk response
      const userDataResult = await tx
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      return {
        updatedStatus: {
          ...updatedStatus,
          user: userDataResult[0],
        },
        slaInfo,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Status pengajuan berhasil diperbarui',
      data: result.updatedStatus,
      sla: result.slaInfo,
    });
  } catch (error) {
    console.error('Error in update status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * DELETE STATUS
 */
const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID status tidak valid',
      });
    }

    const statusId = Number(id);

    // Cek apakah status ada
    const existingStatusResult = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.id, statusId))
      .limit(1);

    if (existingStatusResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Status tidak ditemukan',
      });
    }

    // Cek apakah ini status pertama (DIAJUKAN) dari aplikasi
    const allStatuses = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.applicationId, existingStatusResult[0].applicationId))
      .orderBy(asc(applicationStatus.createdAt));

    if (allStatuses.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Status terakhir tidak dapat dihapus',
      });
    }

    await db.delete(applicationStatus).where(eq(applicationStatus.id, statusId));

    return res.status(200).json({
      success: true,
      message: 'Status pengajuan berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in delete status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET SLA BY APPLICATION
 */
const getSLAByApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID aplikasi tidak valid',
      });
    }

    const applicationId = Number(id);

    // Cek apakah aplikasi exists
    const applicationExists = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.id, applicationId))
      .limit(1);

    if (applicationExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan',
      });
    }

    const slaData = await db
      .select()
      .from(applicationSla)
      .where(eq(applicationSla.applicationId, applicationId))
      .orderBy(asc(applicationSla.createdAt));

    // Hitung total durasi
    const totalDuration = slaData.reduce(
      (sum, sla) => sum + (sla.durationMinutes || 0),
      0
    );

    return res.status(200).json({
      success: true,
      message: 'Data SLA berhasil ditemukan',
      data: {
        transitions: slaData,
        total_duration_minutes: totalDuration,
        total_duration_hours: (totalDuration / 60).toFixed(2),
        total_duration_days: (totalDuration / (60 * 24)).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error in get SLA by application:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET ALL SLA - Untuk monitoring
 */
const getAllSLA = async (req, res) => {
  try {
    const slaData = await db
      .select({
        id: applicationSla.id,
        application_id: applicationSla.applicationId,
        from_status: applicationSla.fromStatus,
        to_status: applicationSla.toStatus,
        start_time: applicationSla.startTime,
        end_time: applicationSla.endTime,
        duration_minutes: applicationSla.durationMinutes,
        catatan: applicationSla.catatan,
        created_at: applicationSla.createdAt,
        application: {
          kode_pengajuan: creditApplication.kodePengajuan,
          nama_lengkap: creditApplication.namaLengkap,
        },
      })
      .from(applicationSla)
      .leftJoin(
        creditApplication,
        eq(applicationSla.applicationId, creditApplication.id)
      )
      .orderBy(desc(applicationSla.createdAt));

    return res.status(200).json({
      success: true,
      message: 'Data SLA berhasil ditemukan',
      data: slaData,
    });
  } catch (error) {
    console.error('Error in get all SLA:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllStatus,
  getStatusByApplication,
  createStatus,
  updateStatus,
  deleteStatus,
  getSLAByApplication,
  getAllSLA,
};