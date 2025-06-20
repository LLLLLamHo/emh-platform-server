import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { TABLE_NAME as USER_TABEL_NAME } from './user';

export const TABLE_NAME = 'moods';

export interface MoodAttributes {
  id: number;
  userId: number;
  dateStr: string;  // 格式：YYYY-MM-DD
  timestamp: number;  // 时间戳
  mood: string;
  content?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MoodCreationAttributes = Optional<MoodAttributes, 'id' | 'content' | 'createdAt' | 'updatedAt'>;

export class MoodModel extends Model<MoodAttributes, MoodCreationAttributes> implements MoodAttributes {
  static async initModel(sequelize: Sequelize): Promise<typeof MoodModel> {
    MoodModel.init({
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
      dateStr: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      mood: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    }, {
      sequelize,
      tableName: TABLE_NAME,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'timestamp'],
        },
      ],
    });

    await MoodModel.sync();
    await sequelize.query(`ALTER TABLE ${TABLE_NAME} AUTO_INCREMENT = 10000;`);
    console.log(`${TABLE_NAME} table sync seccess!`);

    return MoodModel;
  }

  public id!: number;
  public userId!: number;
  public dateStr!: string;
  public timestamp!: number;
  public mood!: string;
  public content!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
