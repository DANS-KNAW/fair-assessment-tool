# FAIR-Aware

FAIR-Aware is a self-assessment tool that raises awareness on data FAIRness (Findable, Accessible, Interoperable, Reusable).

<a href="https://doi.org/10.5281/zenodo.5084664"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.5084664.svg" alt="DOI"></a>

## Development

Prerequisites: Node.js v22+, pnpm, Docker

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/FAIRsFAIR/fair-assessment-tool.git
   cd fair-assessment-tool
   pnpm install
   ```

2. Configure the environment:

   ```bash
   cp .env.example .env
   ```

3. Start the MySQL database and dev server:

   ```bash
   make dev
   ```

4. Seed a dev admin account (`root@fairaware.system.com` / `admin123`):

   ```bash
   make seed
   ```

> To reset the database and reseed from scratch, run `make reset`.

### Makefile targets

| Target       | Description                                               |
| ------------ | --------------------------------------------------------- |
| `make dev`   | Starts MySQL container and runs the dev server            |
| `make seed`  | Seeds a dev admin account                                 |
| `make reset` | Destroys the database volume, restarts MySQL, and reseeds |
| `make build` | Builds the project for production                         |
| `make clean` | Stops all Docker containers                               |

## Production

### Building

```bash
pnpm build
```

This compiles TypeScript and Tailwind CSS into the `dist/` and `public/` directories.

### Database Setup

Import the schema into your MySQL 8.0 instance:

```bash
mysql -u <user> -p <database> < database_structure.sql
```

The database starts empty with no default users. Schema migrations run automatically on each app startup.

### Creating the First Admin

Use the CLI to create an admin account:

```bash
node dist/cli.js create-admin --email admin@example.com --password <strong_password>
```

### Starting the Server

```bash
node dist/index.js
```

The application will be available at `http://localhost:3000` (or your configured `APPLICATION_PORT`).

## Citation

If you use FAIR-Aware in your work, please cite:

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.5084664.svg)](https://doi.org/10.5281/zenodo.5084664)
