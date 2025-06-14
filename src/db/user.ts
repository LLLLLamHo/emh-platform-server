import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

const TABLE_NAME = 'users';
// 1. 定义模型属性接口
export interface UserAttributes {
  id: number;
  username: string;
  nickname: string;
  openid: string;
  unionid?: string | null;
  phone?: number | null;
  gender: number;
  freeze: number;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. 定义创建时可选的字段（比如自增id，createdAt等）
export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'unionid' | 'phone' | 'avatar' | 'createdAt' | 'updatedAt'>;

// 3. 定义模型类，继承自 Sequelize 的 Model
export class UserModel extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public nickname!: string;
  public openid!: string;
  public unionid!: string | null;
  public phone!: number | null;
  public avatar!: string | null;;
  public gender!: number;
  public freeze!: number;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export async function createUserModule(sequelize: Sequelize) {
  // 5. 传入泛型，告诉 Sequelize 这个模型的类型
  const user = sequelize.define<UserModel, UserCreationAttributes>('User', {
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
      allowNull: true,
      unique: true,
    },
    phone: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gender: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    freeze: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: TABLE_NAME,
    timestamps: true,
  });

  await user.sync();
  await sequelize.query(`ALTER TABLE ${TABLE_NAME} AUTO_INCREMENT = 10000;`);

  return user;
}
