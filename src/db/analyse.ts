import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { TABLE_NAME as USER_TABEL_NAME } from './user';

export const TABLE_NAME = 'analyses';

export interface AnalyseAttributes {
  id: number;
  userId: number;
  year: number;  // 年份
  month: number; // 月份 (1-12)
  analysisContent: string; // 心情分析结果（字符串）
  createdAt?: Date;
  updatedAt?: Date;
}

export type AnalyseCreationAttributes = Optional<AnalyseAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class AnalyseModel extends Model<AnalyseAttributes, AnalyseCreationAttributes> implements AnalyseAttributes {
  static async initModel(sequelize: Sequelize): Promise<typeof AnalyseModel> {
    AnalyseModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: USER_TABEL_NAME,
          key: 'id',
        },
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 2020,
          max: 2030,
        },
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 12,
        },
      },
      analysisContent: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '心情分析结果内容',
      },
    }, {
      sequelize,
      tableName: TABLE_NAME,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'year', 'month'],
          name: 'unique_user_year_month',
        },
        {
          fields: ['userId'],
          name: 'idx_user_id',
        },
        {
          fields: ['year', 'month'],
          name: 'idx_year_month',
        },
      ],
    });

    await AnalyseModel.sync();
    await sequelize.query(`ALTER TABLE ${TABLE_NAME} AUTO_INCREMENT = 10000;`);
    console.log(`${TABLE_NAME} table sync success!`);

    return AnalyseModel;
  }

  public id!: number;
  public userId!: number;
  public year!: number;
  public month!: number;
  public analysisContent!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
} 