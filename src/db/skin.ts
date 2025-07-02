import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

const TABLE_NAME = 'skins';

export interface SkinAttributes {
  id: number;
  user_id: number;
  skin: 'emoji1' | 'emoji2' | 'emoji3' | 'emoji4' | 'emoji5' | 'emoji6';
  createdAt?: Date;
  updatedAt?: Date;
}

export type SkinCreationAttributes = Optional<SkinAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class SkinModel extends Model<SkinAttributes, SkinCreationAttributes> implements SkinAttributes {
  static async initModel(sequelize: Sequelize): Promise<typeof SkinModel> {
    SkinModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      skin: {
        type: DataTypes.ENUM('emoji1', 'emoji2', 'emoji3', 'emoji4', 'emoji5', 'emoji6'),
        allowNull: false,
      },
    }, {
      sequelize,
      tableName: TABLE_NAME,
      timestamps: true,
      indexes: [
        {
          name: 'user_skin_composite_index',
          unique: false,
          fields: ['user_id', 'skin'],
        },
      ],
    });

    await SkinModel.sync();
    return SkinModel;
  }
  
  public id!: number;
  public user_id!: number;
  public skin!: 'emoji1' | 'emoji2' | 'emoji3' | 'emoji4' | 'emoji5' | 'emoji6';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
