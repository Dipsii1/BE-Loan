const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET ALL USERS
exports.getAll = async function (req, res) {
  try {
    const data = await prisma.profile.findMany({
      include: {
        role: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Data user berhasil ditemukan',
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan saat mengambil data user',
    });
  }
};

// GET USER BY ID
exports.getById = async function (req, res) {
  try {
    const id = req.params.id;

    const data = await prisma.profile.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!data) {
      return res.status(404).json({
        code: 404,
        message: 'User tidak ditemukan',
      });
    }

    return res.status(200).json({
      code: 200,
      message: 'Data user berhasil ditemukan',
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Terjadi kesalahan saat mengambil data user',
    });
  }
};

// CREATE USER
exports.create = async function (req, res) {
  const { id, name, email, no_phone, role_id } = req.body;

  if (!id || !name || !email || !role_id) {
    return res.status(400).json({
      code: 400,
      message: 'Field wajib tidak lengkap',
    });
  }

  try {
    const data = await prisma.profile.create({
      data: {
        id,
        name,
        email,
        no_phone: no_phone || null,
        role_id,
      },
      include: {
        role: true,
      },
    });

    return res.status(201).json({
      code: 201,
      message: 'User berhasil ditambahkan',
      data: data,
    });

  } catch (error) {

    // jika gagal simpan ke database, hapus user di supabase
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (e) {
      console.error('gagal hapus user supabase', e.message);
    }

    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal membuat user',
    });
  }
};


// UPDATE USER BY ID
exports.update = async function (req, res) {
  try {
    const id = req.params.id;

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.no_phone !== undefined)
      updateData.no_phone = req.body.no_phone;
    if (req.body.role_id !== undefined)
      updateData.role_id = req.body.role_id;

    const data = await prisma.profile.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    return res.status(200).json({
      code: 200,
      message: 'User berhasil diperbarui',
      data: data,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        code: 404,
        message: 'User tidak ditemukan',
      });
    }

    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal memperbarui user',
    });
  }
};

// DELETE USER BY ID
exports.remove = async function (req, res) {
  try {
    const id = req.params.id;

    await prisma.profile.delete({
      where: { id },
    });

    return res.status(200).json({
      code: 200,
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        code: 404,
        message: 'User tidak ditemukan',
      });
    }

    return res.status(400).json({
      code: 400,
      message: error.message || 'Gagal menghapus user',
    });
  }
};
