import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

const TABLE_NAME = 'members';

export interface MemberAttributes {
  id: number;
  user_id: number;
  membership_start_time: Date;
  membership_end_time: Date;
  membership_renew_time: Date;
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
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      membership_start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      membership_end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      membership_renew_time: {
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
  public user_id!: number;
  public membership_start_time!: Date;
  public membership_end_time!: Date;
  public membership_renew_time!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
