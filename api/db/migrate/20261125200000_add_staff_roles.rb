class AddStaffRoles < ActiveRecord::Migration[8.1]
  def up
    add_column :users, :bookable, :boolean, null: false, default: true

    # Donos que já existiam como conta do painel, sem aparecer no link.
    execute <<~SQL
      UPDATE users SET bookable = FALSE WHERE role = 'owner';
      UPDATE users SET role = 'owner' WHERE account_owner = TRUE AND role = 'artist';
    SQL
  end

  def down
    execute <<~SQL
      UPDATE users SET role = 'artist' WHERE account_owner = TRUE AND role = 'owner' AND bookable = TRUE;
    SQL
    remove_column :users, :bookable
  end
end