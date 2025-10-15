# FAIR-Aware

FAIR-Aware – A self-assessment tool to raise awareness of users on data FAIRness.

<a href="https://doi.org/10.5281/zenodo.5084664"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.5084664.svg" alt="DOI"></a>

## Usage

### Notice

The [database_structure.sql](database_structure.sql) includes a default "admin" user. This user should be removed or atleast it's `access_token` changed.

- email: `root@fairaware.system.com`
- password: `ccfb09f1c2b847a6b0d10e24b9ac5545a28d2f91822f843c72a4c6c937f78e2045b23c9850e119f7`

### Running with Docker (Recommended)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/FAIRsFAIR/fair-assessment-tool.git
   cd fair-assessment-tool
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

The application will be available at `http://localhost:3000` (or your configured port).

**Note:** The [docker-compose.yml](docker-compose.yml) file automatically:

- Sets up the web server
- Initializes the database using [database_structure.sql](database_structure.sql)
- Configures all necessary services
- Mounts volumes for persistent data

### Running Natively

For local development or deployment without Docker:

1. **Prerequisites:**

   - Node.js (v14 or higher)
   - MySQL database

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Besure to change the MYSQL_DATABASE_HOST to your database host.
   ```

4. **Set up the database (if using):**

   ```bash
   mysql -u username -p database_name < database_structure.sql
   ```

5. **Build the project:**

   ```bash
   npm run build
   ```

6. **Start the application:**
   ```bash
   pnpm start
   ```

## Trainer Functionality

FAIR-Aware includes features for trainers:

- Track assessment results by course
- Download aggregated all results.
- See detailed [trainer instructions](/documents/trainer_instructions.pdf)

## Citation

If you use FAIR-Aware in your work, please cite:

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.5084664.svg)](https://doi.org/10.5281/zenodo.5084664)
