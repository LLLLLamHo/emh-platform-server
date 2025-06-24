import { ModelCtor, Sequelize } from 'sequelize';
import { UserModel } from './user';
import { MoodModel } from './mood';

export type DB = {
  userModule: ModelCtor<UserModel>;
  moodModule: ModelCtor<MoodModel>;
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
    const userModule = await UserModel.initModel(sequelize);
    const moodModule = await MoodModel.initModel(sequelize);

    // 关联用户表和心情表
    UserModel.hasMany(MoodModel, { foreignKey: 'userId', sourceKey: 'id', as: 'moods' });
    MoodModel.belongsTo(UserModel, { foreignKey: 'userId', targetKey: 'id', as: 'user' });

    return {
      userModule,
      moodModule,
    };
  } catch (error) {
    console.error('数据库连接或同步失败:', error);
  }
}
