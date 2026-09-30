# Elle est prête la bouffe ?

Une appli web de planification de repas inspirée de [Planivore](https://www.planivore.eu/) : Claude compose tes menus de la semaine selon ton foyer, tes goûts, ton matériel et ton budget, écrit les recettes, puis prépare **la liste de courses Lidl**, rangée dans l'ordre des rayons et avec les prix estimés.

## Fonctionnalités

- **Réglages du foyer** : adultes et enfants, jours et repas à prévoir (déjeuner, dîner), budget de la semaine, régime (omnivore → vegan), contraintes (sans porc, sans gluten…), allergies, envies, équipement (four, airfryer, Monsieur Cuisine…), temps max, niveau, et ce que tu as déjà dans tes placards.
- **Menu de la semaine** : un plat par créneau, avec coût estimé, temps et étiquettes. La jauge de budget montre où tu en es.
- **Changer un plat** en un clic, avec une envie en option (« plus rapide », « moins cher », « sans four »…), ou le retirer.
- **Recettes détaillées** générées en tâche de fond : ingrédients avec quantités pour tout le foyer, étapes, astuce.
- **Liste de courses Lidl** :
  - ingrédients additionnés d'une recette à l'autre, puis transformés en produits Lidl avec leur conditionnement (« Filet d'oignons jaunes 1 kg ») et un prix estimé ;
  - classée par rayon, dans l'ordre d'un parcours type en magasin ;
  - les basiques (sel, huile…) et ce que tu as déjà sont mis à part, hors total ;
  - cases à cocher en magasin, ajouts perso, copier / partager en texte ;
  - signale quand le menu a changé et qu'il faut la mettre à jour.
- Tout est enregistré **dans le navigateur** (pas de compte, pas de base de données).

## Et l'envoi direct vers Lidl Plus ?

Pas possible pour l'instant : Lidl ne propose aucune API pour remplir la liste de courses de l'appli Lidl Plus, et aucun projet communautaire n'a documenté cette partie de l'appli. Le détail, et la marche à suivre pour l'ajouter un jour, sont dans [docs/LIDL_PLUS.md](docs/LIDL_PLUS.md).

En attendant, la page **Courses** est pensée pour être utilisée directement en magasin sur ton téléphone.

## Démarrer

Prérequis : Node.js 22 ou plus récent et une [clé API Anthropic](https://console.anthropic.com/settings/keys).

```bash
npm install
cp .env.example .env   # puis renseigne ANTHROPIC_API_KEY
npm run dev            # http://localhost:3000
```

| Variable | Rôle |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (obligatoire). |
| `NUXT_APP_PASSWORD` | Code d'accès exigé sur toutes les routes `/api`. À définir dès que l'appli est en ligne, sinon n'importe qui peut consommer tes crédits. Le code se saisit ensuite dans **Réglages**. |
| `NUXT_ANTHROPIC_MODEL` | Modèle Claude utilisé (par défaut `claude-opus-5-5`). |

Autres commandes : `npm run build` (build de production), `npm run typecheck`, `npm test`.

## Déployer sur Vercel

1. Importe le dépôt dans Vercel (le preset Nuxt est détecté automatiquement).
2. Ajoute les variables `ANTHROPIC_API_KEY` et `NUXT_APP_PASSWORD`.
3. Déploie. La durée maximale des fonctions est fixée à 300 s dans `nuxt.config.ts`, car Claude peut mettre une à deux minutes à répondre.

## Comment ça marche

```
Réglages ──► POST /api/plan ─────────► menu de la semaine (titres, coûts, temps)
                 │
                 └► POST /api/recipe ×N ► recettes détaillées (3 en parallèle)
                          │
   addition des ingrédients (côté navigateur)
                          │
                 POST /api/shopping-list ► produits Lidl, conditionnements, prix
```

- Chaque route appelle Claude avec une **sortie JSON imposée** (schémas Zod dans `shared/schemas.ts`) : pas de texte à interpréter, les réponses sont validées avant d'arriver dans l'appli.
- Le modèle par défaut est Claude Opus 5.5, avec un effort `medium` pour le menu et la liste, `low` pour les recettes. Le **repli automatique** de l'API Anthropic (`fallbacks: "default"`) est activé : si le modèle déclinait une demande, l'API la rejouerait d'elle-même sur un autre modèle.
- Coût : quelques dizaines de centimes de dollar par semaine générée (estimation à vérifier sur ta console Anthropic, elle dépend du nombre de repas).
- Les prix sont des **estimations** de Claude à partir des tarifs habituels de Lidl France : ils peuvent varier selon le magasin et les promotions.

## Structure

```
app/
  pages/            index (semaine), courses, preferences
  components/       MealCard, RecipeSlideover, BudgetGauge
  composables/      usePlanner (état + actions), usePersistedState, useApi
server/
  api/              plan, meal (changer un plat), recipe, shopping-list
  utils/            claude.ts (appel à l'API), prompts.ts
  middleware/       auth.ts (code d'accès optionnel)
shared/             constantes (rayons, unités…), schémas Zod, calculs de liste
tests/              tests unitaires (Vitest)
docs/LIDL_PLUS.md   état des lieux de l'intégration Lidl Plus
```

Stack : [Nuxt 4](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com), [SDK TypeScript d'Anthropic](https://github.com/anthropics/anthropic-sdk-typescript), Zod.
