import { ModelCtor, Sequelize } from 'sequelize';
import { UserModel } from './user';
import { MoodModel } from './mood';
import { MoodImageModel } from './mood_images';
import { MemberModel } from './member';
import { SkinModel } from './skin';


export type DB = {
  skinModule:  ModelCtor<SkinModel>;
  memberModule: ModelCtor<MemberModel>;
  userModule: ModelCtor<UserModel>;
  moodModule: ModelCtor<MoodModel>;
  moodImageModule: ModelCtor<MoodImageModel>
  sequelize: Sequelize
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
    const moodImageModule = await MoodImageModel.initModel(sequelize);
    const memberModule = await MemberModel.initModel(sequelize);
    const skinModule = await SkinModel.initModel(sequelize);


    // 关联用户表和心情表
    UserModel.hasMany(MoodModel, { foreignKey: 'userId', sourceKey: 'id', as: 'moods' });
    MoodModel.belongsTo(UserModel, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
    MoodImageModel.belongsTo(MoodModel, { foreignKey: 'moodId', targetKey: 'id', as: 'user' });
    MemberModel.belongsTo(UserModel, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
    SkinModel.belongsTo(UserModel, { foreignKey: 'userId', targetKey: 'id', as: 'user' });

    return {
      userModule,
      moodModule,
      moodImageModule,
      memberModule,
      skinModule,
      sequelize,
    };
  } catch (error) {
    console.error('数据库连接或同步失败:', error);
  }
}
