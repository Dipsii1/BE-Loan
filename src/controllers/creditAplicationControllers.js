const prisma = require('../config/prisma');

// Get all credit applications
const getAllApplications = async (req, res) => {
  try {
    const data = await prisma.creditApplication.findMany({
      include: {
        statuses: {
          orderBy: { created_at: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error in get all applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    });
  }
};

// Get credit applications by user ID (logged in user)
const getApplicationsByUser = async (req, res) => {
  try {
    const data = await prisma.creditApplication.findMany({
      where: {
        user_id: req.user.id,
      },
      include: {
        statuses: {
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error in get applications by user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    });
  }
};

// Get credit application by ID
const getApplicationById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const data = await prisma.creditApplication.findUnique({
      where: { id },
      include: {
        statuses: {
          orderBy: { created_at: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data pengajuan kredit tidak ditemukan',
      });
    }

    // Cek akses: hanya pemilik atau admin yang bisa lihat
    if (req.user.role_name !== 'Admin' && data.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke pengajuan ini',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    console.error('Error in get application by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    });
  }
};

// Create new credit application
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
    if (!nik || !nama_lengkap || !alamat || !tempat_lahir || !tanggal_lahir || !jenis_kredit || !plafond || !jaminan) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi',
      });
    }

    const userId = req.user.id;
    const email = req.user.email;

    // Pastikan user ada
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    // Ambil data terakhir berdasarkan kode_pengajuan
    const lastData = await prisma.creditApplication.findFirst({
      where: {
        kode_pengajuan: {
          startsWith: 'L-',
        },
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        kode_pengajuan: true,
      },
    });

    let nextNumber = 1;

    if (lastData?.kode_pengajuan) {
      const lastNumber = parseInt(lastData.kode_pengajuan.replace('L-', ''), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format jadi 4 digit: 0001
    const kode_pengajuan = `L-${String(nextNumber).padStart(4, '0')}`;

    // Validasi enum
    const validJenisKredit = ['KREDIT_PRODUKTIF', 'MULTIGUNA', 'KPR', 'PENSIUN'];
    const validJaminan = ['SERTIFIKAT', 'BPKB', 'SK_PEGAWAI'];

    if (!validJenisKredit.includes(jenis_kredit)) {
      return res.status(400).json({
        success: false,
        message: `Jenis kredit harus salah satu dari: ${validJenisKredit.join(', ')}`,
      });
    }

    if (!validJaminan.includes(jaminan)) {
      return res.status(400).json({
        success: false,
        message: `Jaminan harus salah satu dari: ${validJaminan.join(', ')}`,
      });
    }

    // Create application dengan status awal
    const data = await prisma.creditApplication.create({
      data: {
        nik,
        nama_lengkap,
        alamat,
        tempat_lahir,
        tanggal_lahir: new Date(tanggal_lahir),
        email,
        jenis_kredit,
        plafond: parseFloat(plafond),
        jaminan,
        user_id: userId,
        kode_pengajuan,
        statuses: {
          create: {
            status: 'DIAJUKAN',
            changed_by: userId,
            catatan: 'Pengajuan kredit dibuat',
          },
        },
      },
      include: {
        statuses: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan kredit berhasil dibuat',
      data,
    });
  } catch (error) {
    console.error('Error in create application:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    });
  }
};

// Update credit application
const updateApplication = async (req, res) => {
  try {
    const id = Number(req.params.id);
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

    // Cek apakah application ada dan cek kepemilikan
    const existing = await prisma.creditApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan kredit tidak ditemukan',
      });
    }

    // Cek akses: hanya pemilik yang bisa update
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah pengajuan ini',
      });
    }

    // Cek status: hanya bisa update jika status masih DIAJUKAN
    const lastStatus = await prisma.applicationStatus.findFirst({
      where: { application_id: id },
      orderBy: { created_at: 'desc' },
    });

    if (lastStatus && lastStatus.status !== 'DIAJUKAN') {
      return res.status(400).json({
        success: false,
        message: 'Pengajuan yang sudah diproses tidak dapat diubah',
      });
    }

    // Build update data
    const updateData = {};
    if (nik !== undefined) updateData.nik = nik;
    if (nama_lengkap !== undefined) updateData.nama_lengkap = nama_lengkap;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (tempat_lahir !== undefined) updateData.tempat_lahir = tempat_lahir;
    if (tanggal_lahir !== undefined) updateData.tanggal_lahir = new Date(tanggal_lahir);
    if (jenis_kredit !== undefined) {
      const validJenisKredit = ['KREDIT_PRODUKTIF', 'MULTIGUNA', 'KPR', 'PENSIUN'];
      if (!validJenisKredit.includes(jenis_kredit)) {
        return res.status(400).json({
          success: false,
          message: `Jenis kredit harus salah satu dari: ${validJenisKredit.join(', ')}`,
        });
      }
      updateData.jenis_kredit = jenis_kredit;
    }
    if (plafond !== undefined) updateData.plafond = parseFloat(plafond);
    if (jaminan !== undefined) {
      const validJaminan = ['SERTIFIKAT', 'BPKB', 'SK_PEGAWAI'];
      if (!validJaminan.includes(jaminan)) {
        return res.status(400).json({
          success: false,
          message: `Jaminan harus salah satu dari: ${validJaminan.join(', ')}`,
        });
      }
      updateData.jaminan = jaminan;
    }

    const data = await prisma.creditApplication.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Pengajuan kredit berhasil diperbarui',
      data,
    });
  } catch (error) {
    console.error('Error in update application:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    });
  }
};

// Delete credit application
const deleteApplication = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Cek apakah application ada dan cek kepemilikan
    const existing = await prisma.creditApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan kredit tidak ditemukan',
      });
    }

    // Cek akses: hanya pemilik yang bisa delete
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus pengajuan ini',
      });
    }

    // Cek status: hanya bisa delete jika status masih DIAJUKAN
    const lastStatus = await prisma.applicationStatus.findFirst({
      where: { application_id: id },
      orderBy: { created_at: 'desc' },
    });

    if (lastStatus && lastStatus.status !== 'DIAJUKAN') {
      return res.status(400).json({
        success: false,
        message: 'Pengajuan yang sudah diproses tidak dapat dihapus',
      });
    }

    await prisma.creditApplication.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Pengajuan kredit berhasil dihapus',
    });
  } catch (error) {
    console.error('Error in delete application:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: error.message,
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