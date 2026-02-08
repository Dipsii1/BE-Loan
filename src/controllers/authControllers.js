const { db } = require('../lib/db');
const { users } = require('../lib/schema/users');
const { roles } = require('../lib/schema/roles');
const { eq,sql } = require('drizzle-orm');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * REGISTER USER
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, no_phone, role_id, password } = req.body;

    // Validasi input
    if (!name || !email || !role_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, role_id, dan password wajib diisi',
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid',
      });
    }

    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter',
      });
    }

    // Validasi role_id
    if (!Number.isInteger(role_id) || role_id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Role ID tidak valid',
      });
    }

    // Cek apakah email sudah terdaftar
    const existingUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUserResult.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    // Cek apakah role_id valid
    const roleExistsResult = await db
      .select()
      .from(roles)
      .where(eq(roles.id, role_id))
      .limit(1);

    if (roleExistsResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      });
    }

    let agent_code = null;

    // Generate agent code jika role_id = 2 (Agent)
    if (role_id === 2) {
      agent_code = await generateUniqueAgentCode();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUserResult = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        noPhone: no_phone || null,
        agentCode: agent_code,
        roleId: role_id,
        password: hashedPassword,
      })
      .returning();

    const newUser = newUserResult[0];

    // Get role information
    const userRoleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.id, newUser.roleId))
      .limit(1);

    const userRole = userRoleResult[0];

    // Remove password dari response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Berhasil membuat user baru',
      data: {
        ...userWithoutPassword,
        role: userRole
          ? { id: userRole.id, nama_role: userRole.namaRole }
          : null,
      },
    });
  } catch (error) {
    console.error('Error in register user:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      let field = 'Field';
      if (error.constraint) {
        if (error.constraint.includes('email')) {
          field = 'Email';
        } else if (error.constraint.includes('agent_code')) {
          field = 'Agent code';
        }
      }

      return res.status(409).json({
        success: false,
        message: `${field} sudah digunakan`,
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
 * LOGIN USER
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi',
      });
    }

    // Cari user berdasarkan email dengan role
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        no_phone: users.noPhone,
        agent_code: users.agentCode,
        nasabah_code: users.nasabahCode,
        role_id: users.roleId,
        password: users.password,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
        role: {
          id: roles.id,
          nama_role: roles.namaRole,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    // Cek apakah user ada
    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const userData = userResult[0];

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Validasi JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Konfigurasi server tidak lengkap',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role_id: userData.role_id,
        role_name: userData.role?.nama_role || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      }
    );

    // Remove password dari response
    const { password: _, ...userWithoutPassword } = userData;

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Error in login user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * LOGOUT USER
 */
const logoutUser = async (req, res) => {
  try {
    // Pada JWT stateless, logout dilakukan di client side
    // dengan menghapus token dari storage
    return res.status(200).json({
      success: true,
      message: 'Logout berhasil',
    });
  } catch (error) {
    console.error('Error in logout user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET CURRENT USER
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi',
      });
    }

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        no_phone: users.noPhone,
        agent_code: users.agentCode,
        nasabah_code: users.nasabahCode,
        role_id: users.roleId,
        created_at: users.createdAt,
        updated_at: users.updatedAt,

        role_id_ref: roles.id,
        role_name: roles.namaRole,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const row = result[0];

    const response = {
      id: row.id,
      name: row.name,
      email: row.email,
      no_phone: row.no_phone,
      agent_code: row.agent_code,
      nasabah_code: row.nasabah_code,
      role_id: row.role_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      role: row.role_id_ref
        ? {
            id: row.role_id_ref,
            nama_role: row.role_name,
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      message: 'Berhasil mendapatkan data user',
      data: response,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};

/**
 * HELPER: Generate Unique Agent Code
 */
const generateUniqueAgentCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let isUnique = false;
  let agent_code = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    let randomPart = '';

    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const randomCode = `AG-${randomPart}`;

    const existingAgentResult = await db
      .select()
      .from(users)
      .where(eq(users.agentCode, randomCode))
      .limit(1);

    if (existingAgentResult.length === 0) {
      agent_code = randomCode;
      isUnique = true;
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('Gagal generate unique agent code setelah beberapa percobaan');
  }

  return agent_code;
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
};