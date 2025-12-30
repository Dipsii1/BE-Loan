const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET ALL (ADMIN)
 */
exports.getAll = async (req, res) => {
  try {
    const data = await prisma.applicationStatus.findMany({
      include: {
        application: {
          select: {
            kode_pengajuan: true,
            nama_lengkap: true,
          },
        },
        profile: {
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
      code: 200,
      message: 'Data status pengajuan berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan',
    });
  }
};

/**
 * GET BY APPLICATION ID (ADMIN / NASABAH PEMILIK)
 */
exports.getByApplication = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);

    // Jika bukan ADMIN, cek kepemilikan
    if (req.user.role.name !== 'ADMIN') {
      const owned = await prisma.creditApplication.findFirst({
        where: {
          id: applicationId,
          email: req.user.email,
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
      where: { application_id: applicationId },
      include: {
        profile: {
          select: { name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
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
      message: error.message || 'Terjadi kesalahan',
    });
  }
};

/**
 * CREATE (ADMIN)
 */
exports.create = async (req, res) => {
  try {
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
        changed_role: req.user.role.name,
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

/**
 * UPDATE (ADMIN)
 */
exports.update = async (req, res) => {
  try {
    const { status, catatan } = req.body;

    if (!status || !catatan) {
      return res.status(400).json({
        code: 400,
        message: 'Status dan catatan wajib diisi',
      });
    }

    const data = await prisma.applicationStatus.update({
      where: { id: Number(req.params.id) },
      data: {
        status,
        catatan,
        changed_by: req.user.id,
        changed_role: req.user.role.name,
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

/**
 * DELETE (ADMIN)
 */
exports.remove = async (req, res) => {
  try {
    await prisma.applicationStatus.delete({
      where: { id: Number(req.params.id) },
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
