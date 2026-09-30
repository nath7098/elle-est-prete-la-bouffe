# Envoyer la liste vers Lidl Plus : état des lieux

## En bref

L'appli **ne peut pas** créer la liste de courses directement sur un compte Lidl Plus aujourd'hui :

- Lidl ne publie **aucune API** pour ses applications ni pour la liste de courses de Lidl Plus.
- Les bibliothèques communautaires qui ont rétro-ingénieré l'appli (voir plus bas) couvrent les tickets de caisse, les coupons, la carte de fidélité et les magasins, mais **aucune ne documente la liste de courses**.
- À notre connaissance, Lidl France ne vend pas de courses alimentaires en ligne (ni drive ni livraison) : il n'y a pas non plus de panier web à remplir.

La page **Courses** de l'appli remplace donc la liste Lidl Plus : elle est rangée par rayon, se coche en magasin et reste enregistrée sur le téléphone.

## Ce qui est connu de l'API Lidl Plus

D'après la bibliothèque Python [Andre0512/lidl-plus](https://github.com/Andre0512/lidl-plus) (non officielle) :

- **Authentification** : OAuth 2 / OpenID Connect sur `https://accounts.lidl.com`, client `LidlPlusNativeClient`, avec PKCE et la redirection `com.lidlplus.app://callback`. La connexion initiale passe par le formulaire web de Lidl (identifiant, mot de passe, code SMS) ; on obtient ensuite un *refresh token* échangé contre des jetons d'accès sur `https://accounts.lidl.com/connect/token`.
- **Services documentés** : tickets (`tickets.lidlplus.com`), coupons (`coupons.lidlplus.com`), profil et fidélité (`profile.lidlplus.com`).
- **Liste de courses** : aucun point d'accès documenté.

Autres projets consultés : [zsobix/lidlplus-api](https://github.com/zsobix/lidlplus-api), [KoenZomers/LidlApi](https://github.com/KoenZomers/LidlApi), [c0desyntax/lidl-plus-reverse](https://github.com/c0desyntax/lidl-plus-reverse), [mgruszkiewicz/lidlplus-mcp](https://github.com/mgruszkiewicz/lidlplus-mcp). Aucun ne gère la liste de courses.

## Pour l'ajouter un jour

1. **Capturer le trafic de l'appli** Lidl Plus pendant qu'on ajoute un article à une liste, avec [HTTP Toolkit](https://httptoolkit.com/) ou mitmproxy sur un téléphone Android de test. L'appli peut refuser les certificats d'interception (*certificate pinning*), ce qui complique l'opération.
2. Noter les requêtes utiles : lecture des listes, création d'une liste, ajout d'un article (URL, méthode, en-têtes, corps JSON).
3. Obtenir un refresh token pour son propre compte (par exemple avec la commande `lidl-plus auth` de la bibliothèque Python ci-dessus).
4. Ajouter une route serveur, par exemple `server/api/lidl-plus.post.ts`, qui :
   - lit le refresh token dans une variable d'environnement (`LIDL_PLUS_REFRESH_TOKEN`), **jamais dans le navigateur** : ce jeton donne accès au compte ;
   - l'échange contre un jeton d'accès, en conservant le nouveau refresh token renvoyé ;
   - envoie chaque article de la liste générée.
5. Ajouter un bouton « Envoyer vers Lidl Plus » sur la page Courses.

## Risques à connaître

- Utiliser une API privée est probablement contraire aux conditions d'utilisation de Lidl, et peut entraîner le blocage du compte.
- Lidl peut modifier son API à tout moment : l'intégration casserait sans prévenir.
- Le refresh token doit être protégé comme un mot de passe.
