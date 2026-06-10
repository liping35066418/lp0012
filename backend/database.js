const Database = require('better-sqlite3');
const { DB_PATH } = require('./config');
const logger = require('./logger');
const bcrypt = require('bcryptjs');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  const migration = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        real_name TEXT,
        phone TEXT,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        club_id INTEGER,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status INTEGER DEFAULT 1,
        FOREIGN KEY (club_id) REFERENCES clubs(id)
      );

      CREATE TABLE IF NOT EXISTS clubs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        logo TEXT,
        description TEXT,
        banner TEXT,
        max_members INTEGER DEFAULT 50,
        current_members INTEGER DEFAULT 0,
        president TEXT,
        contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS club_banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        title TEXT,
        link_url TEXT,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        club_id INTEGER NOT NULL,
        real_name TEXT NOT NULL,
        gender TEXT,
        student_id TEXT,
        phone TEXT,
        email TEXT,
        department TEXT,
        grade TEXT,
        reason TEXT,
        skills TEXT,
        status TEXT DEFAULT 'pending',
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        review_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (club_id) REFERENCES clubs(id)
      );

      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        poster TEXT,
        location TEXT,
        start_time DATETIME,
        end_time DATETIME,
        max_participants INTEGER DEFAULT 0,
        current_participants INTEGER DEFAULT 0,
        created_by INTEGER,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS activity_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        real_name TEXT,
        phone TEXT,
        status INTEGER DEFAULT 1,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(activity_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_id INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        cover_image TEXT,
        author_id INTEGER,
        status INTEGER DEFAULT 0,
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT DEFAULT 'system',
        club_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (club_id) REFERENCES clubs(id)
      );

      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        club_id INTEGER NOT NULL,
        position TEXT DEFAULT 'member',
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (club_id) REFERENCES clubs(id),
        UNIQUE(user_id, club_id)
      );
    `);

    const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
    if (adminExists.count === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.prepare(`INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)`).run('admin', hash, '系统管理员', 'admin', 1);
      logger.info('默认管理员账户创建成功: admin / admin123');
    }

    const officerExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('officer');
    if (officerExists.count === 0) {
      const hash = bcrypt.hashSync('officer123', 10);
      db.prepare(`INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)`).run('officer', hash, '社团干事', 'officer', 1);
      logger.info('默认社团干事账户创建成功: officer / officer123');
    }

    const memberExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('member');
    if (memberExists.count === 0) {
      const hash = bcrypt.hashSync('member123', 10);
      db.prepare(`INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)`).run('member', hash, '普通成员', 'member', 1);
      logger.info('默认普通成员账户创建成功: member / member123');
    }

    const clubCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get().count;
    if (clubCount === 0) {
      const clubs = [
        {
          name: '科技创新协会',
          logo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop',
          description: '致力于培养学生科技创新能力，开展各类科技竞赛、创新项目和学术交流活动。我们拥有先进的实验室设备和专业的指导老师，欢迎对科技感兴趣的同学加入！',
          banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop',
          max_members: 80,
          president: '张明',
          contact_phone: '13800138001'
        },
        {
          name: '青年志愿者协会',
          logo: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200&h=200&fit=crop',
          description: '弘扬志愿精神，服务社会大众。组织支教、环保、关爱老人等各类志愿活动，让青春在奉献中闪光。',
          banner: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&h=400&fit=crop',
          max_members: 100,
          president: '李华',
          contact_phone: '13800138002'
        },
        {
          name: '艺术团',
          logo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
          description: '汇聚各类艺术人才，提供专业的艺术培训和展示舞台。涵盖舞蹈、声乐、器乐、戏剧等多个方向。',
          banner: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=400&fit=crop',
          max_members: 60,
          president: '王芳',
          contact_phone: '13800138003'
        },
        {
          name: '篮球俱乐部',
          logo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
          description: '热爱篮球，挥洒汗水。每周组织训练和比赛，提升球技，结交球友，享受篮球带来的快乐！',
          banner: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=1200&h=400&fit=crop',
          max_members: 50,
          president: '刘强',
          contact_phone: '13800138004'
        },
        {
          name: '读书社',
          logo: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop',
          description: '以书会友，品味人生。定期举办读书分享会、书评大赛、作家讲座等活动，打造浓厚的校园书香氛围。',
          banner: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=400&fit=crop',
          max_members: 40,
          president: '赵雪',
          contact_phone: '13800138005'
        }
      ];
      const insertClub = db.prepare(`INSERT INTO clubs (name, logo, description, banner, max_members, president, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      clubs.forEach(club => {
        insertClub.run(club.name, club.logo, club.description, club.banner, club.max_members, club.president, club.contact_phone);
      });
      logger.info('初始化社团数据完成');
    }

    const bannerCount = db.prepare('SELECT COUNT(*) as count FROM club_banners').get().count;
    if (bannerCount === 0) {
      const banners = [
        { image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1600&h=500&fit=crop', title: '欢迎加入社团大家庭', link_url: '/clubs', sort_order: 1 },
        { image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1600&h=500&fit=crop', title: '春季招新火热进行中', link_url: '/enroll', sort_order: 2 },
        { image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=500&fit=crop', title: '精彩活动邀你参与', link_url: '/activities', sort_order: 3 }
      ];
      const insertBanner = db.prepare(`INSERT INTO club_banners (image_url, title, link_url, sort_order) VALUES (?, ?, ?, ?)`);
      banners.forEach(b => insertBanner.run(b.image_url, b.title, b.link_url, b.sort_order));
      logger.info('初始化轮播图数据完成');
    }

    const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get().count;
    if (newsCount === 0) {
      const newsData = [
        { club_id: 1, title: '科技创新协会荣获省级竞赛一等奖', content: '在刚刚结束的省大学生科技创新大赛中，我协会代表队凭借出色的表现荣获一等奖，特此祝贺！', cover_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', author_id: 2, status: 1 },
        { club_id: 2, title: '志愿者协会社区服务活动圆满结束', content: '周末志愿者们走进社区开展关爱老人活动，得到了社区居民的一致好评。', cover_image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop', author_id: 2, status: 1 },
        { club_id: 3, title: '艺术团年度汇演圆满落幕', content: '一年一度的艺术团汇报演出在大礼堂隆重举行，为全校师生献上了一场视听盛宴。', cover_image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop', author_id: 2, status: 1 },
        { club_id: 4, title: '篮球联赛决赛精彩回顾', content: '本年度校园篮球联赛决赛在体育馆激情上演，为大家带来了一场精彩的对决。', cover_image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop', author_id: 2, status: 1 },
        { club_id: 5, title: '读书社世界读书日主题活动', content: '在第28个世界读书日来临之际，读书社举办了丰富多彩的主题活动，吸引众多同学参与。', cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop', author_id: 2, status: 1 }
      ];
      const insertNews = db.prepare(`INSERT INTO news (club_id, title, content, cover_image, author_id, status) VALUES (?, ?, ?, ?, ?, ?)`);
      newsData.forEach(n => insertNews.run(n.club_id, n.title, n.content, n.cover_image, n.author_id, n.status));
      logger.info('初始化动态数据完成');
    }

    const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get().count;
    if (activityCount === 0) {
      const activities = [
        { club_id: 1, title: '机器人编程训练营', description: '零基础机器人编程入门培训，手把手教你搭建和编程机器人', poster: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop', location: '实验楼A301', start_time: '2026-06-15 14:00:00', end_time: '2026-06-15 17:00:00', max_participants: 30, created_by: 2 },
        { club_id: 2, title: '社区环保志愿行', description: '走进社区开展垃圾分类宣传和环境清洁活动', poster: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop', location: '阳光社区', start_time: '2026-06-18 09:00:00', end_time: '2026-06-18 12:00:00', max_participants: 50, created_by: 2 },
        { club_id: 3, title: '校园歌手大赛', description: '第十届校园歌手大赛，等你来战！', poster: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=500&fit=crop', location: '大学生活动中心', start_time: '2026-06-20 19:00:00', end_time: '2026-06-20 22:00:00', max_participants: 200, created_by: 2 }
      ];
      const insertActivity = db.prepare(`INSERT INTO activities (club_id, title, description, poster, location, start_time, end_time, max_participants, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      activities.forEach(a => insertActivity.run(a.club_id, a.title, a.description, a.poster, a.location, a.start_time, a.end_time, a.max_participants, a.created_by));
      logger.info('初始化活动数据完成');
    }
  });

  try {
    migration();
    logger.info('数据库初始化完成');
  } catch (err) {
    logger.error('数据库初始化失败:', err.message);
    throw err;
  }
}

initDatabase();

module.exports = db;
