class AccountOwnerIsTheArtist < ActiveRecord::Migration[8.1]
  def up
    add_column :users, :account_owner, :boolean, null: false, default: false

    execute <<~SQL
      UPDATE users SET account_owner = TRUE WHERE role = 'owner';

      UPDATE working_hours
      SET artist_id = owners.id
      FROM users AS guests
      JOIN users AS owners ON owners.studio_id = guests.studio_id AND owners.account_owner = TRUE
      WHERE working_hours.artist_id = guests.id
        AND guests.role = 'artist'
        AND guests.name = 'Artista convidado'
        AND guests.email LIKE 'artista+%@marcaink.local';

      UPDATE appointments
      SET artist_id = owners.id
      FROM users AS guests
      JOIN users AS owners ON owners.studio_id = guests.studio_id AND owners.account_owner = TRUE
      WHERE appointments.artist_id = guests.id
        AND guests.role = 'artist'
        AND guests.name = 'Artista convidado'
        AND guests.email LIKE 'artista+%@marcaink.local';

      UPDATE blocks
      SET artist_id = owners.id
      FROM users AS guests
      JOIN users AS owners ON owners.studio_id = guests.studio_id AND owners.account_owner = TRUE
      WHERE blocks.artist_id = guests.id
        AND guests.role = 'artist'
        AND guests.name = 'Artista convidado'
        AND guests.email LIKE 'artista+%@marcaink.local';

      UPDATE users AS owners
      SET role = 'artist'
      FROM users AS guests
      WHERE guests.studio_id = owners.studio_id
        AND owners.account_owner = TRUE
        AND owners.role = 'owner'
        AND guests.role = 'artist'
        AND guests.name = 'Artista convidado'
        AND guests.email LIKE 'artista+%@marcaink.local';

      DELETE FROM users
      WHERE role = 'artist'
        AND name = 'Artista convidado'
        AND email LIKE 'artista+%@marcaink.local';
    SQL
  end

  def down
    remove_column :users, :account_owner
  end
end