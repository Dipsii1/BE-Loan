const { db } = require('../lib/db');
const { users } = require('../lib/schema/users');
const { roles } = require('../lib/schema/roles');
const { creditApplication } = require('../lib/schema/creditApplication');
const { applicationStatus } = require('../lib/schema/applicationStatus');

const { eq, desc } = require('drizzle-orm');
const bcrypt = require('bcrypt');

/**
 * GET ALL USERS
 */
const getAllUsers = async (req, res) => {
  try {
    const data = await db
      .select({
        user_id: users.id,
        name: users.name,
        email: users.email,
        no_phone: users.noPhone,
        agent_code: users.agentCode,
        nasabah_code: users.nasabahCode,
        created_at: users.createdAt,
        role_id: roles.id,
        role_name: roles.namaRole,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .orderBy(desc(users.createdAt));

    const result = data.map((u) => ({
      id: u.user_id,
      name: u.name,
      email: u.email,
      no_phone: u.no_phone,
      agent_code: u.agent_code,
      nasabah_code: u.nasabah_code,
      created_at: u.created_at,
      role: u.role_id
        ? {
            id: u.role_id,
            nama_role: u.role_name,
          }
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil seluruh data users',
      data: result,
    });
  } catch (error) {
    console.error('Error in get all users:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET USER BY ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID user tidak valid',
      });
    }

    const userResult = await db
      .select({
        user: users,
        role: roles,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, Number(id)))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const credits = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.userId, Number(id)));

    for (const credit of credits) {
      credit.statuses = await db
        .select()
        .from(applicationStatus)
        .where(eq(applicationStatus.applicationId, credit.id))
        .orderBy(desc(applicationStatus.createdAt));
    }

    const { password, ...userWithoutPassword } = userResult[0].user;

    return res.status(200).json({
      success: true,
      message: 'Berhasil mendapatkan data user',
      data: {
        ...userWithoutPassword,
        role: userResult[0].role,
        credits,
      },
    });
  } catch (error) {
    console.error('Error in get user by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * UPDATE USER
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      no_phone,
      agent_code,
      nasabah_code,
      role_id,
      password,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID user tidak valid',
      });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const updateData = {};

    if (name !== undefined && name !== '') updateData.name = name;
    if (email !== undefined && email !== '') updateData.email = email;
    if (no_phone !== undefined) updateData.noPhone = no_phone;
    if (agent_code !== undefined) updateData.agentCode = agent_code;
    if (nasabah_code !== undefined) updateData.nasabahCode = nasabah_code;

    if (role_id !== undefined && role_id !== '') {
      const roleExists = await db
        .select()
        .from(roles)
        .where(eq(roles.id, Number(role_id)))
        .limit(1);

      if (roleExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role tidak ditemukan',
        });
      }

      updateData.roleId = Number(role_id);
    }

    if (password !== undefined && password !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang diupdate',
      });
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(id)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        no_phone: users.noPhone,
        agent_code: users.agentCode,
        nasabah_code: users.nasabahCode,
        role_id: users.roleId,
      });

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengupdate user',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error in update user:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email atau data lain sudah digunakan',
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
 * DELETE USER
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID user tidak valid',
      });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const creditExist = await db
      .select()
      .from(creditApplication)
      .where(eq(creditApplication.userId, Number(id)))
      .limit(1);

    const statusExist = await db
      .select()
      .from(applicationStatus)
      .where(eq(applicationStatus.changedBy, Number(id)))
      .limit(1);

    if (creditExist.length > 0 || statusExist.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User tidak dapat dihapus karena memiliki data terkait',
      });
    }

    await db.delete(users).where(eq(users.id, Number(id)));

    return res.status(200).json({
      success: true,
      message: 'Berhasil menghapus user',
    });
  } catch (error) {
    console.error('Error in delete user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET USERS BY ROLE
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role_id } = req.params;

    if (!role_id || isNaN(Number(role_id))) {
      return res.status(400).json({
        success: false,
        message: 'ID role tidak valid',
      });
    }

    const roleId = Number(role_id);

    const roleExists = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (roleExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      });
    }

    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        no_phone: users.noPhone,
        agent_code: users.agentCode,
        nasabah_code: users.nasabahCode,
        created_at: users.createdAt,
        role: {
          id: roles.id,
          nama_role: roles.namaRole,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.roleId, roleId))
      .orderBy(desc(users.createdAt));

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data users berdasarkan role',
      data,
    });
  } catch (error) {
    console.error('Error in get users by role:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
};