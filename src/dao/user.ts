import { Sequelize, DataTypes } from 'sequelize';

export function createUserModule(sequelize: Sequelize) {
  const user = sequelize.define('User', {
    // 定义字段
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    openid: {
      type: DataTypes.STRING(28),
      allowNull: false,
      unique: true,
    },
    unionid: {
      type: DataTypes.STRING(29),
      allowNull: false,
      unique: true,
      // default: ''
    },
    phone: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      // default: ''
    },
    freeze: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // default: 0
    },
  }, {
    tableName: 'users',  // 指定表名，默认是模型名复数
    timestamps: true,    // 自动添加 createdAt 和 updatedAt 字段
  });
  return user;
}
