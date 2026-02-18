# FAIR-Aware

FAIR-Aware is a self-assessment tool that raises awareness on data FAIRness (Findable, Accessible, Interoperable, Reusable).

<a href="https://doi.org/10.5281/zenodo.5084664"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.5084664.svg" alt="DOI"></a>

## Development

Prerequisites: Node.js v22+, pnpm, Docker

```bash
git clone https://github.com/DANS-KNAW/fair-assessment-tool.git
cd fair-assessment-tool
make setup
```

This builds the full Docker stack, seeds a default admin account (`root@fairaware.system.com` / `admin123`), and starts the application.

Run `make help` to see all available commands.

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
