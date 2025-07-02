import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

const TABLE_NAME = 'members';

export interface MemberAttributes {
  id: number;
  userId: number;
  expirationTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MemberCreationAttributes = Optional<MemberAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class MemberModel extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
  static async initModel(sequelize: Sequelize): Promise<typeof MemberModel> {
    MemberModel.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // 唯一值，一个用户只能有一个会员记录
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      expirationTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
      sequelize,
      tableName: TABLE_NAME,
      timestamps: true,
    });

    await MemberModel.sync();
    return MemberModel;
  }
  public id!: number;
  public userId!: number;
  public expirationTime!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
