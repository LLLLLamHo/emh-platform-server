import { Sequelize } from 'sequelize';
import { createUserModule } from './dao/user';
import { createCounterModule } from './dao/counter';


// 从环境变量中读取数据库配置
const { MYSQL_USERNAME = '', MYSQL_PASSWORD = '', MYSQL_ADDRESS = '' } = process.env;
const [host, port = 80] = MYSQL_ADDRESS.split(':');

const sequelize = new Sequelize('nodejs_demo', MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port: +port,
  dialect: 'mysql' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 数据库初始化方法
export async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    const userModule = createUserModule(sequelize);
    const counterModule = createCounterModule(sequelize);
    console.log('用户表同步成功');

    return {
      user: userModule,
      counter: counterModule,
    };
  } catch (error) {
    console.error('数据库连接或同步失败:', error);
  }
}
