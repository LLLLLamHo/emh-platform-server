import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { TABLE_NAME as USER_TABEL_NAME } from './user';

export const TABLE_NAME = 'analyse_result';

export interface AnalyseResultAttributes {
  id: number;
  userId: number;
  year: number;
  month: number;
  status: 'success' | 'empty' | 'failed'; // 分析结果状态
  createdAt?: Date;
  updatedAt?: Date;
}

export type AnalyseResultCreationAttributes = Optional<AnalyseResultAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class AnalyseResultModel extends Model<AnalyseResultAttributes, AnalyseResultCreationAttributes> implements AnalyseResultAttributes {
  static async initModel(sequelize: Sequelize): Promise<typeof AnalyseResultModel> {
    AnalyseResultModel.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '用户ID',
          references: {
            model: USER_TABEL_NAME,
            key: 'id',
          },
        },
        year: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '年份',
        },
        month: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '月份 (1-12)',
        },
        status: {
          type: DataTypes.ENUM('success', 'failed', 'empty'),
          allowNull: false,
          comment: '分析结果状态',
        },
      },
      {
        sequelize,
        tableName: TABLE_NAME,
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['userId', 'year', 'month'],
            name: 'idx_user_year_month_unique',
          },
          {
            fields: ['userId'],
            name: 'idx_user_id',
          },
          {
            fields: ['year', 'month'],
            name: 'idx_year_month',
          },
          {
            fields: ['status'],
            name: 'idx_status',
          },
        ],
      },
    );

    await AnalyseResultModel.sync();
    return AnalyseResultModel;
  }

  public id!: number;
  public userId!: number;
  public year!: number;
  public month!: number;
  public status!: 'success' | 'empty' | 'failed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
