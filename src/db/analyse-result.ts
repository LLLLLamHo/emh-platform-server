import { Model, DataTypes, ModelCtor } from 'sequelize';
import { Sequelize } from 'sequelize';

export const TABLE_NAME = 'analyse_result';

export interface AnalyseResultAttributes {
  id: number;
  userId: number;
  year: number;
  month: number;
  status: 'success' | 'failed'; // 分析结果状态
  errorMessage?: string; // 失败时的错误信息
  analysisContent?: string; // 成功时的分析内容
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnalyseResultCreationAttributes extends Omit<AnalyseResultAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class AnalyseResultModel extends Model<AnalyseResultAttributes, AnalyseResultCreationAttributes> {
  public id!: number;
  public userId!: number;
  public year!: number;
  public month!: number;
  public status!: 'success' | 'failed';
  public errorMessage?: string;
  public analysisContent?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): ModelCtor<AnalyseResultModel> {
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
          type: DataTypes.ENUM('success', 'failed'),
          allowNull: false,
          comment: '分析结果状态',
        },
        errorMessage: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '失败时的错误信息',
        },
        analysisContent: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '成功时的分析内容',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
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
      }
    );

    return AnalyseResultModel;
  }
} 