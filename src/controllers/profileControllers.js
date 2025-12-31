const prisma = require('../config/prisma');

// GET ALL PROFILES
exports.getAll = async (req, res) => {
  try {
    const data = await prisma.profile.findMany({
      include: {
        role: {
          select: {
            id: true,
            nama_role: true,
          },
        },
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Data profile berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};


// GET PROFILE BY USER ID
exports.getById = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await prisma.profile.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            nama_role: true,
          },
        },
      },
    });

    if (!data) {
      return res.status(404).json({
        code: 404,
        message: 'Profile tidak ditemukan',
      });
    }

    return res.status(200).json({
      code: 200,
      message: 'Profile berhasil ditemukan',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};



// CREATE PROFILE
exports.create = async (req, res) => {
  try {
    const data = await prisma.profile.create({
      data: {
        id: req.body.id, // UUID dari auth
        name: req.body.name,
        email: req.body.email,
        no_phone: req.body.no_phone,
        role_id: req.body.role_id,
      },
      include: {
        role: true,
      },
    });

    return res.status(201).json({
      code: 201,
      message: 'Profile berhasil dibuat',
      data,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
};


// UPDATE PROFILE BY USER ID
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await prisma.profile.update({
      where: { id },
      data: {
        name: req.body.name,
        no_phone: req.body.no_phone,
        role_id: req.body.role_id,
      },
      include: {
        role: true,
      },
    });

    return res.status(200).json({
      code: 200,
      message: 'Profile berhasil diperbarui',
      data,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
};


// DELETE PROFILE BY USER ID
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;

    await prisma.profile.delete({
      where: { id },
    });

    return res.status(200).json({
      code: 200,
      message: 'Profile berhasil dihapus',
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
};

