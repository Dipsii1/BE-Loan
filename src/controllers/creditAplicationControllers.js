const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// get all
exports.getAll = async function (req, res) {
  try {
    const data = await prisma.creditApplication.findMany({
      include: {
        statuses: true,
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan saat mengambil data',
    });
  }
};

// get by kode
exports.getByKode = async function (req, res) {
  try {
    const data = await prisma.creditApplication.findUnique({
      where: {
        kode_pengajuan: req.params.kode_pengajuan,
      },
      include: {
        statuses: true,
      },
    });

    if (!data) {
      return res.status(404).json({
        code: 404,
        message: 'Data pengajuan kredit tidak ditemukan',
      });
    }

    return res.status(200).json({
      code: 200,
      message: 'Data pengajuan kredit berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan saat mengambil data',
    });
  }
};

exports.create = async function (req, res) {
  try {
    // 1️⃣ Ambil profile dari user login
    const profile = await prisma.profile.findUnique({
      where: {
        id: req.user.id, // auth.users.id
      },
    });

    if (!profile) {
      return res.status(404).json({
        code: 404,
        message: 'Profile user tidak ditemukan',
      });
    }

    // 2️⃣ Ambil data terakhir untuk generate kode
    const lastData = await prisma.creditApplication.findFirst({
      where: {
        kode_pengajuan: {
          startsWith: 'L-',
        },
      },
      orderBy: {
        kode_pengajuan: 'desc',
      },
    });

    let nextNumber = 1;

    if (lastData) {
      const lastNumber = parseInt(lastData.kode_pengajuan.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const kodePengajuan = `L-${String(nextNumber).padStart(3, '0')}`;

    // 3️⃣ Create credit application
    const data = await prisma.creditApplication.create({
      data: {
        kode_pengajuan: kodePengajuan,
        nik: req.body.nik,
        nama_lengkap: req.body.nama_lengkap,
        tempat_lahir: req.body.tempat_lahir,
        tanggal_lahir: new Date(req.body.tanggal_lahir),
        alamat: req.body.alamat,
        email: profile.email, // 🔥 dari profile
        jenis_kredit: req.body.jenis_kredit,
        plafond: req.body.plafond,
        jaminan: req.body.jaminan,

        profile_id: profile.id, // 🔥 relasi ke Profile

        statuses: {
          create: {
            status: 'DIAJUKAN',
            changed_by: profile.id, // 🔥 dari profile
            catatan: 'Pengajuan dibuat oleh nasabah',
          },
        },
      },
      include: {
        statuses: true,
      },
    });

    return res.status(201).json({
      code: 201,
      message: 'Pengajuan kredit berhasil ditambahkan',
      data,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal menambahkan data',
    });
  }
};



// update
exports.update = async function (req, res) {
  try {
    const data = await prisma.creditApplication.update({
      where: {
        kode_pengajuan: req.params.kode_pengajuan,
      },
      data: {
        nik: req.body.nik,
        nama_lengkap: req.body.nama_lengkap,
        tempat_lahir: req.body.tempat_lahir,
        tanggal_lahir: new Date(req.body.tanggal_lahir),
        alamat: req.body.alamat,
        email: req.body.email,
        jenis_kredit: req.body.jenis_kredit,
        plafond: req.body.plafond,
        jaminan: req.body.jaminan,
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Pengajuan kredit berhasil diperbarui',
      data,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal memperbarui data',
    });
  }
};

// delete
exports.remove = async function (req, res) {
  try {
    await prisma.creditApplication.delete({
      where: {
        kode_pengajuan: req.params.kode_pengajuan,
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Pengajuan kredit berhasil dihapus',
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal menghapus data',
    });
  }
};
