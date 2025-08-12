import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export const TABLE_NAME = 'global_config';

// 1. 定义模型属性接口
export interface GlobalConfigAttributes {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. 定义创建时可选的字段
export type GlobalConfigCreationAttributes = Optional<GlobalConfigAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'>;

// 3. 定义模型类
export class GlobalConfigModel extends Model<GlobalConfigAttributes, GlobalConfigCreationAttributes> implements GlobalConfigAttributes {
  // 4. 静态初始化方法
  static async initModel(sequelize: Sequelize): Promise<typeof GlobalConfigModel> {
    GlobalConfigModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: '配置键名',
      },
      value: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: '配置值',
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '配置描述',
      },
    }, {
      sequelize,
      tableName: TABLE_NAME,
      timestamps: true,
    });

    await GlobalConfigModel.sync();
    console.log(`${TABLE_NAME} table sync success!`);

    // 初始化默认配置
    await GlobalConfigModel.bulkCreate([
      {
        key: 'show_payment_module',
        value: 'true',
        description: '是否展示支付模块',
      },
    ], {
      ignoreDuplicates: true,
    });

    return GlobalConfigModel;
  }

  public id!: number;
  public key!: string;
  public value!: string;
  public description!: string | null;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
} 