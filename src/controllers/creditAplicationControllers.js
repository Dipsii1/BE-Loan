const { db } = require('../lib/db');
const { creditApplication } = require('../lib/schema/creditApplication');
const { applicationStatus } = require('../lib/schema/applicationStatus');
const { users } = require('../lib/schema/users');

const { eq, desc, and, like } = require('drizzle-orm');

/**
 * GET ALL APPLICATIONS (ADMIN)
 */
const getAllApplications = async (req, res) => {
  try {
    const data = await db
      .select({
        id: creditApplication.id,
        kode_pengajuan: creditApplication.kodePengajuan,
        nama_lengkap: creditApplication.namaLengkap,
        email: creditApplication.email,
        jenis_kredit: creditApplication.jenisKredit,
        plafond: creditApplication.plafond,
        created_at: creditApplication.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(creditApplication)
      .leftJoin(users, eq(creditApplication.userId, users.id))
      .orderBy(desc(creditApplication.createdAt));

    return res.status(200).json({
      success: true,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error get all applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET APPLICATIONS BY LOGGED USER
 */
const getApplicationsByUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi',
      });
    }

    const applications = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.userId, req.user.id))
      .orderBy(desc(creditApplication.createdAt));

    // Get statuses for each application
    const data = await Promise.all(
      applications.map(async (app) => {
        const statuses = await db
          .select()
          .from(applicationStatus)
          .where(eq(applicationStatus.applicationId, app.id))
          .orderBy(desc(applicationStatus.createdAt));

        return {
          id: app.id,
          kode_pengajuan: app.kodePengajuan,
          nama_lengkap: app.namaLengkap,
          email: app.email,
          jenis_kredit: app.jenisKredit,
          plafond: app.plafond,
          jaminan: app.jaminan,
          created_at: app.createdAt,
          statuses,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error get applications by user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET APPLICATION BY ID
 */
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID pengajuan tidak valid',
      });
    }

    const applicationId = Number(id);

    const result = await db
      .select({
        application: creditApplication,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(creditApplication)
      .leftJoin(users, eq(creditApplication.userId, users.id))
      .where(eq(creditApplication.id, applicationId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data pengajuan kredit tidak ditemukan',
      });
    }

    const data = result[0];

    // Authorization check
    if (
      req.user.role_name !== 'Admin' &&
      data.application.userId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke pengajuan ini',
      });
    }

    // Ambil status history
    const statuses = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.applicationId, applicationId))
      .orderBy(desc(applicationStatus.createdAt));

    return res.status(200).json({
      success: true,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data: {
        ...data.application,
        user: data.user,
        statuses,
      },
    });
  } catch (error) {
    console.error('Error get application by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * CREATE APPLICATION
 */
const createApplication = async (req, res) => {
  try {
    const {
      nik,
      nama_lengkap,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      jenis_kredit,
      plafond,
      jaminan,
    } = req.body;

    // Validasi input
    if (
      !nik ||
      !nama_lengkap ||
      !alamat ||
      !tempat_lahir ||
      !tanggal_lahir ||
      !jenis_kredit ||
      !plafond ||
      !jaminan
    ) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    // Validasi NIK (16 digit)
    if (!/^\d{16}$/.test(nik)) {
      return res.status(400).json({
        success: false,
        message: 'NIK harus 16 digit angka',
      });
    }

    // Validasi plafond
    const plafondValue = parseFloat(plafond);
    if (isNaN(plafondValue) || plafondValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Plafond harus berupa angka positif',
      });
    }

    // Validasi tanggal lahir
    const birthDate = new Date(tanggal_lahir);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal lahir tidak valid',
      });
    }

    // Generate kode pengajuan
    const lastCodeResult = await db
      .select({
        kode: creditApplication.kodePengajuan,
      })
      .from(creditApplication)
      .where(like(creditApplication.kodePengajuan, 'L-%'))
      .orderBy(desc(creditApplication.id))
      .limit(1);

    let nextNumber = 1;
    if (lastCodeResult.length > 0) {
      const lastCode = lastCodeResult[0].kode;
      const match = lastCode.match(/L-(\d+)/);
      if (match) {
        const last = parseInt(match[1], 10);
        if (!isNaN(last)) nextNumber = last + 1;
      }
    }

    const kode_pengajuan = `L-${String(nextNumber).padStart(4, '0')}`;

    // Transaction untuk insert application dan status
    const result = await db.transaction(async (tx) => {
      const appResult = await tx
        .insert(creditApplication)
        .values({
          nik,
          namaLengkap: nama_lengkap,
          alamat,
          tempatLahir: tempat_lahir,
          tanggalLahir: birthDate,
          email: req.user.email,
          jenisKredit: jenis_kredit,
          plafond: plafondValue,
          jaminan,
          userId: req.user.id,
          kodePengajuan: kode_pengajuan,
        })
        .returning();

      const application = appResult[0];

      await tx.insert(applicationStatus).values({
        applicationId: application.id,
        status: 'DIAJUKAN',
        catatan: 'Pengajuan kredit dibuat',
        changedBy: req.user.id,
      });

      return application;
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan kredit berhasil dibuat',
      data: result,
    });
  } catch (error) {
    console.error('Error create application:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'NIK atau kode pengajuan sudah terdaftar',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * UPDATE APPLICATION (ONLY DIAJUKAN)
 */
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID pengajuan tidak valid',
      });
    }

    const applicationId = Number(id);

    const existing = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.id, applicationId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan kredit tidak ditemukan',
      });
    }

    // Authorization check
    if (existing[0].userId !== req.user.id && req.user.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah pengajuan ini',
      });
    }

    // Check last status
    const lastStatus = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.applicationId, applicationId))
      .orderBy(desc(applicationStatus.createdAt))
      .limit(1);

    if (lastStatus.length && lastStatus[0].status !== 'DIAJUKAN') {
      return res.status(400).json({
        success: false,
        message: 'Pengajuan yang sudah diproses tidak dapat diubah',
      });
    }

    const {
      nik,
      nama_lengkap,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      jenis_kredit,
      plafond,
      jaminan,
    } = req.body;

    const updateData = {};

    if (nik !== undefined) {
      if (!/^\d{16}$/.test(nik)) {
        return res.status(400).json({
          success: false,
          message: 'NIK harus 16 digit angka',
        });
      }
      updateData.nik = nik;
    }

    if (nama_lengkap !== undefined && nama_lengkap !== '') {
      updateData.namaLengkap = nama_lengkap;
    }

    if (alamat !== undefined && alamat !== '') {
      updateData.alamat = alamat;
    }

    if (tempat_lahir !== undefined && tempat_lahir !== '') {
      updateData.tempatLahir = tempat_lahir;
    }

    if (tanggal_lahir !== undefined) {
      const birthDate = new Date(tanggal_lahir);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format tanggal lahir tidak valid',
        });
      }
      updateData.tanggalLahir = birthDate;
    }

    if (jenis_kredit !== undefined && jenis_kredit !== '') {
      updateData.jenisKredit = jenis_kredit;
    }

    if (plafond !== undefined) {
      const plafondValue = parseFloat(plafond);
      if (isNaN(plafondValue) || plafondValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Plafond harus berupa angka positif',
        });
      }
      updateData.plafond = plafondValue;
    }

    if (jaminan !== undefined && jaminan !== '') {
      updateData.jaminan = jaminan;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate',
      });
    }

    await db
      .update(creditApplication)
      .set(updateData)
      .where(eq(creditApplication.id, applicationId));

    return res.status(200).json({
      success: true,
      message: 'Pengajuan kredit berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error update application:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'NIK sudah terdaftar',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * DELETE APPLICATION
 */
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID pengajuan tidak valid',
      });
    }

    const applicationId = Number(id);

    const existing = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.id, applicationId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan kredit tidak ditemukan',
      });
    }

    // Authorization check
    if (existing[0].userId !== req.user.id && req.user.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus pengajuan ini',
      });
    }

    // Check if there are related statuses (cascade delete should handle this, but good to check)
    const relatedStatuses = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.applicationId, applicationId));

    // Delete in transaction
    await db.transaction(async (tx) => {
      // Delete related statuses first
      if (relatedStatuses.length > 0) {
        await tx
          .delete(applicationStatus)
          .where(eq(applicationStatus.applicationId, applicationId));
      }

      // Delete application
      await tx
        .delete(creditApplication)
        .where(eq(creditApplication.id, applicationId));
    });

    return res.status(200).json({
      success: true,
      message: 'Pengajuan kredit berhasil dihapus',
    });
  } catch (error) {
    console.error('Error delete application:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllApplications,
  getApplicationsByUser,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
};