import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

const TABLE_NAME = 'moods';

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
  public id!: number;
  public userId!: number;
  public dateStr!: string;
  public timestamp!: number;
  public mood!: string;
  public content!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export async function createMoodModule(sequelize: Sequelize) {
  const mood = sequelize.define<MoodModel, MoodCreationAttributes>('Mood', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
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
    tableName: TABLE_NAME,
    timestamps: true,
  });

  // 强制同步表结构
  await mood.sync();
  return mood;
}
