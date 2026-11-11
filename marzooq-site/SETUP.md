# Putting marzooq.co.uk live

About 20 minutes, once. After this you never need to touch code: you update the site from marzooq.co.uk/admin.

How it fits together: the site's files live on GitHub (free). Every time something changes, GitHub rebuilds the site and hosts it (also free). Squarespace just keeps the domain and points it at GitHub. Your email forwarding stays exactly as it is.

## 1. Put the files on GitHub

1. Make a free account at github.com if you don't have one.
2. Top right, **+ → New repository**. Name it `marzooq-site`, set it to **Public** (free hosting needs public; nothing private is in it), and leave everything else unticked. Create it.
3. On the empty repo page, click **uploading an existing file**.
4. Unzip `marzooq-site.zip` on your computer, open the folder, select **everything inside it** (including the `.github` folder) and drag it into the upload box. Click **Commit changes**.

## 2. Tell the admin page which repo to use

1. In the repo, open `src/admin/config.yml`, click the pencil icon.
2. Change `YOUR-GITHUB-USERNAME` on line 6 to your GitHub username. Commit.

## 3. Switch on hosting

1. Repo **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab. A "Build and deploy" run should be going (if not, click it and press **Run workflow**). When it goes green, your site is live at `https://YOUR-USERNAME.github.io/marzooq-site/`. Don't worry if that address looks a bit broken; it works properly once the domain is connected.
4. Back in **Settings → Pages**, under **Custom domain**, type `marzooq.co.uk` and save.

## 4. Point the domain at GitHub (Squarespace)

1. Squarespace → **Domains → marzooq.co.uk**.
2. Turn off the current **forwarding/redirect** to Substack.
3. Open **DNS settings**. **Do not touch any MX records** (they're your email forwarding).
4. Delete any existing A records or CNAME for `@` and `www` that point elsewhere (the Squarespace defaults). Then add:

| Type  | Host | Data                          |
|-------|------|-------------------------------|
| A     | @    | 185.199.108.153               |
| A     | @    | 185.199.109.153               |
| A     | @    | 185.199.110.153               |
| A     | @    | 185.199.111.153               |
| CNAME | www  | YOUR-USERNAME.github.io       |

5. Wait (usually under an hour, can be up to a day). Then in GitHub **Settings → Pages**, tick **Enforce HTTPS** once it lets you.

Send yourself an email to test@marzooq.co.uk afterwards to check forwarding still works.

## 5. Set up your admin login

1. GitHub → your profile picture → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name it `site admin`, set an expiry (a year is fine), **Repository access → Only select repositories → marzooq-site**.
3. **Permissions → Repository permissions → Contents → Read and write**. Generate, and copy the token.
4. Go to `https://marzooq.co.uk/admin/`, choose **Sign in with Token**, paste it. Your browser remembers it. Treat it like a password.

## Using the admin page

- **Now**: edit the lines and the "Updated" month.
- **Photography**: add photos to Personal work or Commissions, drag to reorder, add a caption. Tick "Show on homepage" on three photos for the homepage strip. Export from Lightroom as **sRGB JPEG, ~2000px long edge, quality 80**.
- **Featured writing**: paste Substack links. Title and cover come from Substack automatically. Leave it empty to show your latest three posts. New posts are picked up every morning.
- **CV**: each section has entries. Tick **Current** to show an entry under "Right now"; untick it when the role ends. Upload a CV PDF to show a "Download PDF" link.

Every save rebuilds the site; changes show within a couple of minutes.

## Welsh

The CY switch translates the fixed text (menu, headings, bio, buttons). It's a draft: get a fluent speaker to check it before you tell people. The Welsh lives in `src/index.njk`, `src/photography.njk`, `src/cv.njk` and `src/_includes/base.njk` (look for the second text in each `{% t "English", "Cymraeg" %}`) and the `title_cy` fields in the CV section of the admin page.
