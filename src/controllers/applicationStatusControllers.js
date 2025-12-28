const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET ALL
exports.getAll = async function (req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        code: 403,
        message: 'Hanya admin yang dapat mengakses data ini',
      });
    }

    const data = await prisma.applicationStatus.findMany({
      include: {
        application: {
          select: {
            kode_pengajuan: true,
            nama_lengkap: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Data status pengajuan berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan saat mengambil data',
    });
  }
};

// GET BY APPLICATION ID (USER / ADMIN)
exports.getByApplication = async function (req, res) {
  try {
    const applicationId = Number(req.params.id);
    const { role, email } = req.user;

    // validasi kepemilikan pengajuan untuk nasabah
    if (role !== 'ADMIN') {
      const owned = await prisma.creditApplication.findFirst({
        where: {
          id: applicationId,
          email: email,
        },
      });

      if (!owned) {
        return res.status(403).json({
          code: 403,
          message: 'Anda tidak memiliki akses ke pengajuan ini',
        });
      }
    }

    const data = await prisma.applicationStatus.findMany({
      where: {
        application_id: applicationId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (data.length === 0) {
      return res.status(404).json({
        code: 404,
        message: 'Status pengajuan tidak ditemukan',
      });
    }

    return res.status(200).json({
      code: 200,
      message: 'Data status pengajuan berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan saat mengambil data',
    });
  }
};

// CREATE
exports.create = async function (req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        code: 403,
        message: 'Hanya admin yang dapat menambahkan status',
      });
    }

    const { application_id, status, catatan } = req.body;

    if (!application_id || !status || !catatan) {
      return res.status(400).json({
        code: 400,
        message: 'application_id, status, dan catatan wajib diisi',
      });
    }

    const data = await prisma.applicationStatus.create({
      data: {
        application_id,
        status,
        catatan,
        changed_by: req.user.id,
        changed_role: 'ADMIN',
      },
    });

    return res.status(201).json({
      code: 201,
      message: 'Status pengajuan berhasil ditambahkan',
      data,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal menambahkan status',
    });
  }
};

// UPDATE
exports.update = async function (req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        code: 403,
        message: 'Hanya admin yang dapat memperbarui status',
      });
    }

    const { status, catatan } = req.body;

    if (!status || !catatan) {
      return res.status(400).json({
        code: 400,
        message: 'Status dan catatan wajib diisi',
      });
    }

    const data = await prisma.applicationStatus.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status,
        catatan,
        changed_by: req.user.id,
        changed_role: 'ADMIN',
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Status pengajuan berhasil diperbarui',
      data,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal memperbarui status',
    });
  }
};

// DELETE
exports.remove = async function (req, res) {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        code: 403,
        message: 'Hanya admin yang dapat menghapus status',
      });
    }

    await prisma.applicationStatus.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Status pengajuan berhasil dihapus',
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal menghapus status',
    });
  }
};
