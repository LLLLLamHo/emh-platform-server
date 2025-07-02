import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { TABLE_NAME as USER_TABEL_NAME } from './user';
const TABLE_NAME = 'mood_images';

export interface MoodImageAttributes {
  id: number;
  moodId: number;
  userId: number;
  timestamp: number;  // 时间戳
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MoodImageCreationAttributes = Optional<MoodImageAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class MoodImageModel extends Model<MoodImageAttributes, MoodImageCreationAttributes> implements MoodImageAttributes {
  public id!: number;
  public moodId!: number;
  public userId!: number;
  public timestamp!: number;
  public imageUrl!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static async initModel(sequelize: Sequelize): Promise<typeof MoodImageModel> {
    MoodImageModel.init({
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
      moodId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'moods',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      timestamp: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    }, {
      sequelize,
      tableName: TABLE_NAME,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['moodId', 'timestamp'],
        },
      ],
    });

    await MoodImageModel.sync();
    await sequelize.query(`ALTER TABLE ${TABLE_NAME} AUTO_INCREMENT = 10000;`);
    console.log(`${TABLE_NAME} table sync seccess!`);

    return MoodImageModel;
  }
}
