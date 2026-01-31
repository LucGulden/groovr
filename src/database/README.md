# Scripts de base de données Groovr

Ce dossier contient tous les scripts SQL pour configurer la base de données Supabase.

## Utilisation

### Installation initiale

1. Allez dans votre dashboard Supabase
2. Ouvrez le **SQL Editor**
3. Exécutez les scripts dans cet ordre :
   - `migrations/001_initial_schema.sql` - Créer les tables
   - `policies.sql` - Configurer la sécurité (RLS)

### Ajouter de nouvelles migrations

Créez un nouveau fichier dans `migrations/` avec un numéro incrémental :
- Format : `XXX_description.sql`
- Exemple : `002_add_posts_table.sql`

## Structure

```
database/
├── README.md                           # Ce fichier
├── migrations/
│   └── 001_initial_schema.sql         # Schéma initial
└── policies.sql                        # Policies de sécurité
```

## Notes importantes

- **RLS (Row Level Security)** : Toutes les tables utilisent RLS pour protéger les données
- **Triggers** : Un trigger crée automatiquement le profil utilisateur lors de l'inscription
- **Indexes** : Des index sont créés pour optimiser les performances