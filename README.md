# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Despliegue en AWS

El workflow `.github/workflows/deploy.yml` publica cada push a `main` en un bucket S3 privado servido por CloudFront. GitHub Actions asume un rol IAM mediante OIDC; no se guardan credenciales AWS de larga duración.

### Bootstrap inicial

Requisitos: AWS CLI autenticado con permisos para crear buckets, CloudFront e IAM; Terraform 1.10 o posterior; `gh` autenticado en GitHub. La cuenta debe tener el proveedor OIDC `token.actions.githubusercontent.com` con audiencia `sts.amazonaws.com`.

Desde la raíz del repositorio, crea el bucket remoto de Terraform y configura el backend:

```sh
export AWS_REGION=us-east-1
export TF_BUCKET_NAME="hack-saltillo-ui-$(aws sts get-caller-identity --query Account --output text)-${AWS_REGION}-tfstate"

aws s3api create-bucket --bucket "$TF_BUCKET_NAME" --region "$AWS_REGION"
terraform -chdir=terraform init -input=false \
  -backend-config="bucket=$TF_BUCKET_NAME" \
  -backend-config="key=hack-saltillo-ui/terraform.tfstate" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="encrypt=true" \
  -backend-config="use_lockfile=true"
terraform -chdir=terraform import aws_s3_bucket.tfstate "$TF_BUCKET_NAME"
terraform -chdir=terraform plan -out=tfplan
terraform -chdir=terraform apply tfplan
```

Guarda los outputs sensibles al despliegue como secrets del repositorio:

```sh
gh secret set role_arn --body "$(terraform -chdir=terraform output -raw role_arn)"
gh secret set tf_bucket_name --body "$(terraform -chdir=terraform output -raw tf_bucket_name)"
```

Después del primer push a `main`, el sitio estará disponible en el output `cloudfront_url`. El rol OIDC acepta ejecuciones desde cualquier rama de este repositorio.
