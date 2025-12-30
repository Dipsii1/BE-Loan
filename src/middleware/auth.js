const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: 'Token tidak ditemukan',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Validasi token ke Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        code: 401,
        message: 'Token tidak valid atau kadaluarsa',
      });
    }

    // Ambil profile + role dari DB
    const user = await prisma.profile.findUnique({
      where: { id: data.user.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'Profile tidak ditemukan',
      });
    }

    if (!user.role) {
      return res.status(500).json({
        code: 500,
        message: 'Role user tidak ditemukan',
      });
    }

    // Inject ke request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.nama_role.toUpperCase(), 
      },
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Autentikasi gagal',
    });
  }
};

module.exports = { authenticate };
