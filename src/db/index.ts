import { ModelCtor, Sequelize } from 'sequelize';
import { createUserModule, UserModel } from './user';
import { createMoodModule, MoodModel } from './mood';

export type DB = {
  user: ModelCtor<UserModel>;
  mood: ModelCtor<MoodModel>;
};

// 数据库初始化方法
export async function initDB(): Promise<DB | undefined> {
  try {
    // 从环境变量中读取数据库配置
    const { MYSQL_USERNAME = '', MYSQL_PASSWORD = '', MYSQL_ADDRESS = '', MYSQL_NAME = '' } = process.env;
    const [host, port = 80] = MYSQL_ADDRESS.split(':');

    const sequelize = new Sequelize(MYSQL_NAME, MYSQL_USERNAME, MYSQL_PASSWORD, {
      host,
      port: +port,
      dialect: 'mysql' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
    });

    await sequelize.authenticate();
    console.log('数据库连接成功');
    const userModule = await createUserModule(sequelize);
    const moodModule = await createMoodModule(sequelize);
    console.log('用户表和心情表同步成功');

    return {
      user: userModule,
      mood: moodModule,
    };
  } catch (error) {
    console.error('数据库连接或同步失败:', error);
  }
}
