class Model {
    /**
     * Récupère la liste des replays présents dans la base de données
     * Appelle callback une fois l'opération de récupération terminée
     */
    static RetrieveReplays(callback) {
        Model.Replays = new Array();
        App.Get(App.EndPoint + "/collections/get/Replays", (data) => {
            try {
                data = JSON.parse(data);
                data.forEach((e) => {
                    Model.Replays.push(new Replay(e));
                });
                callback();
            }
            catch (e) {
                App.Error(e);
            }
        }, function () {
            App.Error(new Error("Unable to reach page"));
        });
    }
    /**
     * Récupère la liste des articles présents dans la base de données
     * Appelle callback une fois l'opération de récupération terminée
     */
    static RetrieveArticles(callback) {
        Model.Articles = new Array();
        App.Get(App.EndPoint + "/collections/get/Articles", (data) => {
            try {
                data = JSON.parse(data);
                data.forEach((e) => {
                    let a = new Article(e);
                    if (a.Lang() == Locale.GetInstance().GetLang())
                        Model.Articles.push(a);
                });
                // tri des articles par date de parution décroissant 
                // TODO: à tester 
                Model.Articles.sort((a, b) => {
                    if (a.Created() > b.Created())
                        return -1;
                    else if (a.Created() < b.Created())
                        return 1;
                    return 0;
                });
                callback();
            }
            catch (e) {
                App.Error(e);
            }
        }, function () {
            App.Error(new Error("Unable to reach page"));
        });
    }
    /*
    public static Retrieve(callback : Function) : void
    {
        Model.RetrieveArticles(() => {
            Model.RetrieveReplays(() => {
                callback();
            });
        });
    }*/
    /**
     * Retourne l'article possédant l'id précisé depuis la liste des articles présents dans le CMS
     */
    static GetArticle(id) {
        if (Model.Articles == null)
            throw Error("Les articles doivent être récupérés depuis le CMS avant opération.");
        for (let i = 0; i != Model.Articles.length; i++) {
            let e = Model.Articles[i];
            if (e.Id() == id) {
                return e;
            }
        }
        return null;
    }
    static GetArticles() {
        if (Model.Articles == null)
            throw Error("Les articles doivent être récupérés depuis le CMS avant opération.");
        return Model.Articles;
    }
    static GetReplays() {
        if (Model.Replays == null)
            throw Error("Les replays doivent être récupérés depuis le CMS avant opération.");
        return Model.Replays;
    }
}
Model.Articles = null;
Model.Replays = null;
class Article {
    constructor(data) {
        this.id = data._id;
        this.title = data.Title;
        this.picture = data.Picture;
        this.description = data.Description;
        this.content = data.Content;
        this.created = data.created;
        this.modified = data.modified;
        this.lang = data.Lang;
    }
    // Id dans la base de données 
    Id() {
        return this.id;
    }
    // Titre de l'article 
    Title() {
        return this.title;
    }
    // Photo de preview de l'article
    Picture() {
        return this.picture;
    }
    // Description de l'article
    Description() {
        return this.description;
    }
    // Retourne le contenu de l'article
    Content() {
        return this.content;
    }
    // Retourne la date de modification de l'article (timestamp visiblement)
    Modified() {
        return this.modified;
    }
    // Retourne la date de création de l'article (timestamp visiblement)
    Created() {
        return this.created;
    }
    Lang() {
        return this.lang;
    }
}
class Replay {
    constructor(data) {
        this.id = data._id;
        this.title = data.Title;
        this.description = data.Description;
        this.picture = data.Picture;
        this.url = data.Url;
        this.created = data.created;
    }
    Id() {
        return this.id;
    }
    Title() {
        return this.title;
    }
    Description() {
        return this.description;
    }
    Picture() {
        return this.picture;
    }
    Url() {
        return this.url;
    }
    Created() {
        return this.created;
    }
}
/**
 * Représente un composant de l'interface
 */
class Component {
    constructor(args) {
        if (args.body == undefined)
            throw new Error("You must define a body to this component");
        this.body = args.body;
        this.classes = args.classes;
        this.mountable = false;
    }
    SetMountable() {
        this.mountable = true;
    }
    GetDOM() {
        return document.getElementById("component-" + this.id);
    }
    /**
     * Construit le composant dans la page
     */
    Mount(parent, opts) {
        if (this.mountable == false)
            throw new Error("You must set this component mountable (Call this.Add(theComponent) in the view's source code)");
        this.id = Component.IDS;
        Component.IDS = Component.IDS + 1;
        let par;
        if (parent == null)
            par = null;
        else if (parent.id == undefined)
            throw Error("Parent must be mount.");
        else
            par = "component-" + parent.id;
        this.Render(par, opts);
    }
    /**
     * Affiche le composant dans la page
     */
    Render(parent, opts) {
        let target;
        if (parent != null)
            target = document.getElementById(parent);
        else {
            if (View.RootID == null)
                target = document.body;
            else
                target = document.getElementById(View.RootID);
        }
        // remplacement des valeurs
        if (opts != null) {
            for (var key in opts) {
                let reg = new RegExp("{{" + key + "}}", "g");
                this.body = this.body.replace(reg, opts[key]);
            }
        }
        // Construction du DOM
        let dom = document.createElement("div");
        dom.id = "component-" + this.id;
        dom.className = this.constructor.name;
        if (this.classes != undefined)
            dom.className += " " + this.classes;
        dom.innerHTML = this.body;
        dom.addEventListener("click", (event) => { this.Click(event); });
        target.appendChild(dom);
    }
    AddClass(clas) {
        this.GetDOM().className = this.GetDOM().className + " " + clas;
    }
    /**
     * Gère l'action lors du click sur le composant
     */
    Click(ev) {
    }
}
Component.IDS = 0;
class ArticleComponent extends Component {
    constructor(article) {
        super({
            body: "\<div class='thumbnail' style='background-image: url({{picture}});'></div>\
                <div class='content'>\
                    <p>{{description}}</p>\
                </div>\
                <a href='Index.html?article-{{id}}'>\
                    <button class='more'>\
                        {{readMore}}\
                    </button>\
                </a>\
                ",
            classes: "item Article"
        });
        this.article = article;
    }
    Mount(parent) {
        let opts = {
            'id': this.article.Id(),
            'picture': this.article.Picture(),
            'description': this.article.Description(),
            'readMore': Locale.GetInstance().Word("ReadMore"),
        };
        super.Mount(parent, opts);
        this.GetDOM().setAttribute("data-title", this.article.Title());
    }
}
class ArticleFocusComponent extends Component {
    constructor(article) {
        super({
            body: "\<div class='thumbnail' style='background-image: url({{picture}});'></div>\
                <div class='content'>\
                    <p>{{content}}</p>\
                </div>\
                ",
            classes: "item Article"
        });
        this.article = article;
    }
    Mount(parent) {
        let opts = {
            picture: this.article.Picture(),
            content: this.article.Content()
        };
        super.Mount(parent, opts);
        this.GetDOM().setAttribute("data-title", this.article.Title());
    }
}
class DisqusComponent extends Component {
    constructor(article) {
        super({
            body: "<div id='disqus_thread'></div>\
                    <script>"
        });
        this.article = article;
    }
    Mount(parent) {
        super.Mount(parent, null);
        /**
        *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
        *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables*
        **/
        /*var disqus_config = function () {
        this.page.url = '/article';  // Replace PAGE_URL with your page's canonical URL variable\
        this.page.identifier = this.article.Id(); // Replace PAGE_IDENTIFIER with your page's unique identifier variable\
        };*/
        var d = document, s = d.createElement('script');
        s.src = 'http://allard.disqus.com/embed.js';
        s.setAttribute('data-timestamp', new Date().toString());
        (d.head || d.body).appendChild(s);
    }
}
class ReplayComponent extends Component {
    constructor(replay) {
        super({
            body: "<h2>{{title}}</h2>\
                <div class='thumbnail' style='background-image: url({{picture}});'></div>\
                <a href='{{url}}'>\
                    <button>\
                        {{download}}\
                    </button>\
                </a>",
            classes: 'Replay item'
        });
        this.replay = replay;
    }
    Mount(parent) {
        let opts = {
            title: this.replay.Title(),
            picture: this.replay.Picture(),
            url: this.replay.Url(),
            download: Locale.GetInstance().Word("Download"),
        };
        super.Mount(parent, opts);
    }
}
class MessageComponent extends Component {
    constructor(title, message) {
        super({
            body: "<p>{{message}}</p>",
            classes: "item"
        });
        this.title = title;
        this.message = message;
    }
    Mount(parent) {
        let opts = {
            message: this.message
        };
        super.Mount(parent, opts);
        this.GetDOM().setAttribute("data-title", this.title);
    }
}
class TitleComponent extends Component {
    constructor(title) {
        super({
            body: "{{message}}",
            classes: "Title"
        });
        this.content = title;
    }
    Mount(parent) {
        let opts = {
            message: this.content
        };
        super.Mount(parent, opts);
    }
}
/**
 * Composant présentant les derniers articles parus
 */
class LastsArticlesComponent extends Component {
    constructor(articles, articleNumber) {
        super({
            body: "<table>\
                        <tr>\
                            <th>{{title}}</th><th>{{date}}</th>\
                        </tr>\
                        {{content}}\
                    </table>",
            classes: "Frame item"
        });
        // selection des articleNumber derniers aticles
        this.articles = new Array();
        for (let i = 0; i != articleNumber; i++) {
            if (articles[i] != null)
                this.articles.push(articles[i]);
        }
    }
    Mount(parent) {
        let content = "";
        this.articles.forEach((e) => {
            let date = new Date(e.Created() * 1000);
            content = content + "<tr><td><a href='Index.html?article-" + e.Id() + "'>" + e.Title() + "</a></td><td>" + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + "</td></tr>";
        });
        let opts = {
            'content': content,
            'title': Locale.GetInstance().Word("Title"),
            'date': Locale.GetInstance().Word("Date"),
        };
        super.Mount(parent, opts);
        this.GetDOM().setAttribute("data-title", Locale.GetInstance().Word("LastArticles"));
    }
}
/**
 * Composant présentant les derniers articles parus
 */
class LastsReplaysComponent extends Component {
    constructor(replays, replayNumber) {
        super({
            body: "<table>\
                        <tr>\
                            <th>{{title}}</th><th>{{date}}</th>\
                        </tr>\
                        {{content}}\
                    </table>",
            classes: "Frame item"
        });
        // selection des articleNumber derniers aticles
        this.replays = new Array();
        for (let i = 0; i != replayNumber; i++) {
            if (replays[i] != null)
                this.replays.push(replays[i]);
        }
    }
    Mount(parent) {
        let content = "";
        this.replays.forEach((e) => {
            let date = new Date(e.Created() * 1000);
            content = content + "<tr><td><a href='Index.html?replays'>" + e.Title() + "</a></td><td>" + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + "</td></tr>";
        });
        let opts = {
            'content': content,
            'title': Locale.GetInstance().Word("Title"),
            'date': Locale.GetInstance().Word("Date"),
        };
        super.Mount(parent, opts);
        this.GetDOM().setAttribute("data-title", Locale.GetInstance().Word("LastReplays"));
    }
}
/**
 * Une vue est un element consituté d'un ensemble de composants permettant de présenter des informations à l'utilisateur
 */
class View {
    constructor() {
        this.components = new Array();
    }
    /**
     * Ajoute un composant à la vue
     */
    Add(component) {
        component.SetMountable();
        this.components.push(component);
        return component;
    }
    /**
     * Affiche la vue
     */
    Show() {
        if (View.RootID == null)
            document.body.innerHTML = "";
        else
            document.getElementById(View.RootID).innerHTML = "";
    }
    /**
     * Appelé lorsque l'on rentre dans la vue
     */
    Enter() {
    }
    /**
     * Appelé lorsque l'on quitte la vue
     */
    Leave() {
    }
}
/**
 * ID (#) de l'élement DOM sur lequel fixer la vue. Si RootID est null, la vue se fixe sur <body>.
 */
View.RootID = null;
/**
 * Présente la liste des articles par ordre descendant de dates
 */
class ArticlesView extends View {
    /**
     * Action a réaliser lors de l'affichage de la vue
     */
    Show() {
        let base = new Component({
            body: "",
            classes: "Articles"
        });
        this.Add(base);
        base.Mount(null, null);
        // Ajout du cmposant présentant le titre
        this.Add(new TitleComponent(Locale.GetInstance().Word("Articles"))).Mount(base);
        // pour chacun des articles présents dans le modèle, on ajoute un nouveau composant article chargé de le présenter 
        Model.GetArticles().forEach((data) => {
            this.Add(new ArticleComponent(data)).Mount(base);
        });
    }
}
/**
 * Affiche la view permettant de présenter un unique article
 */
class ArticleFocusView extends View {
    constructor(article) {
        super();
        // Si l'article est nul, on redirige vers l'erreur 404
        if (article == null) {
            window.location.replace("Index.html?" + Link_Special.Error_404);
            return;
        }
        this.article = article;
    }
    /**
     * Actions a réaliser lors de l'affichage de la vue
     */
    Show() {
        super.Show();
        let base = new Component({
            body: "",
            classes: "Articles"
        });
        this.Add(base);
        base.Mount(null, null);
        // Ajout du composant de titre
        this.Add(new TitleComponent(this.article.Title())).Mount(base);
        // Ajout du composant ArticleFocus contenant un unique article 
        let articleFocus = this.Add(new ArticleFocusComponent(this.article));
        articleFocus.Mount(base);
        // Ajout du composant disqus comportant la zone de commmentaires
        this.Add(new DisqusComponent(this.article)).Mount(articleFocus);
    }
}
/**
 * Affiche la gallery des replays
 */
class ReplaysView extends View {
    /**
     * Actions à réaliser lors de l'affichage de la vue
     */
    Show() {
        super.Show();
        let base = new Component({
            body: '<div></div>',
            classes: 'Replays'
        });
        this.Add(base);
        base.Mount(null, null);
        // Afichage du titre 
        this.Add(new TitleComponent(Locale.GetInstance().Word("Replays"))).Mount(base);
        // Pour chacun des replays on créer un composant chargé de l'afficher 
        Model.GetReplays().forEach((e) => {
            this.Add(new ReplayComponent(e)).Mount(base);
        });
    }
}
/**
 * Présente la page d'index
 */
class IndexView extends View {
    /**
     * Actions àréaliser lors de l'affichae de la page
     */
    Show() {
        super.Show();
        let base = new Component({
            body: "",
            classes: "Index",
        });
        this.Add(base);
        base.Mount(null, null);
        // Affichage du titre de la page 
        this.Add(new TitleComponent(Locale.GetInstance().Word("Index"))).Mount(base);
        // Création d'une zone présentant les informations au sein de la page 
        let indexLayout = new Component({
            body: "",
            classes: "IndexLayout"
        });
        this.Add(indexLayout);
        indexLayout.Mount(base, null);
        // Ajout d'un composant affichant les derniers articles parus 
        let lastArticles = this.Add(new LastsArticlesComponent(Model.GetArticles(), 5));
        lastArticles.Mount(indexLayout);
        // Ajout d'un composant affichant les derniers replays parus 
        let lastReplays = this.Add(new LastsReplaysComponent(Model.GetReplays(), 5));
        lastReplays.Mount(indexLayout);
    }
}
/**
 * Affiche la page d'errur 500 correspondant à erreur serveur
 */
class Error500View extends View {
    /**
     * Actions à réaliser lors de l'affichage de la vue
     */
    Show() {
        super.Show();
        let base = new Component({
            body: ""
        });
        this.Add(base);
        base.Mount(null, null);
        // Affichage du titre de la page 
        this.Add(new TitleComponent(Locale.GetInstance().Word("Error") + " 500")).Mount(base);
        // Affichage du message présentant les détails de l'erreur 
        this.Add(new MessageComponent(Locale.GetInstance().Word("Details"), Locale.GetInstance().Word("Error500"))).Mount(base);
    }
}
/**
 * Affiche la page d'errur 404 correspondant à ressource non trouvée
 */
class Error404View extends View {
    /**
     * Action a réaliser lors de l'affichage de la vue
     */
    Show() {
        super.Show();
        let base = new Component({
            body: ""
        });
        this.Add(base);
        base.Mount(null, null);
        // AJout du composant présentant le titre
        this.Add(new TitleComponent(Locale.GetInstance().Word("Error") + " 404")).Mount(base);
        // AJout du composant présentant le message d'erreur 
        this.Add(new MessageComponent(Locale.GetInstance().Word("Details"), Locale.GetInstance().Word("Error404"))).Mount(base);
    }
}
class Locale {
    constructor(callback) {
        let self = this;
        let error;
        let load = function (lang) {
            self.lang = lang;
            App.Get("Locales/" + lang + ".json", (data) => {
                try {
                    self.data = JSON.parse(data);
                    callback();
                }
                catch (e) {
                    error();
                }
            }, error);
        };
        error = function () {
            load("FR-fr");
        };
        // Récupération de la locale 
        App.Get("http://ip-api.com/json/", (data) => {
            data = JSON.parse(data);
            load(data.countryCode.toUpperCase() + "-" + data.countryCode.toLowerCase());
        }, () => {
            load("FR-fr"); // En cas d'échec de récupération de la localisation, on appelle quand même load avec des valeurs par defaut 
        });
    }
    static CreateInstance(callback) {
        if (Locale.Instance == null)
            Locale.Instance = new Locale(callback);
    }
    static GetInstance() {
        return Locale.Instance;
    }
    GetLang() {
        return this.lang;
    }
    Word(word) {
        return this.data[word];
    }
}
var Link_Special = {
    Default: null,
    Error_500: "ERROR_500",
    Error_404: "ERROR_404"
};
/**
 * Permet d'associer un lien et une méthode, permet de simuler un comportement d'affichage par page
 */
class Link {
    constructor(url, method) {
        this.url = url;
        this.method = method;
    }
}
/**
 * Permet de simuler un système d'affichage par page qui soit totalement transparent pour l'utilisateur
 * On lit un mot à une méthode.
 * Un url compatible doit être de la forme
 * http://blah.com/Index.html?page-par1-par2-par3-...-parn
 */
class Linker {
    constructor() {
        this.registry = new Array();
    }
    static GetInstance() {
        if (Linker.Instance == null)
            Linker.Instance = new Linker();
        return Linker.Instance;
    }
    /**
     * Ajoute un nouveau lien au système (et par la une page)
     */
    AddLink(url, method) {
        if (this.GetLink(url) != null)
            throw Error("Url must be unique.");
        let link = new Link(url, method);
        this.registry.push(link);
    }
    /**
     * Retourne l'objet Link associé à l'url demandée
     */
    GetLink(url) {
        for (let i = 0; i != this.registry.length; i++) {
            let e = this.registry[i];
            if (e.url == url) {
                return e;
            }
        }
        return null;
    }
    /**
     * Annalise l'url de la page courante pour déterminer d'éventuelles actions à réaliser
     */
    Analyze() {
        try {
            let url = window.location.toString().split("?")[1];
            let params = url.split("-");
            url = params.shift();
            this.GetLink(url).method(params);
        }
        catch (e) {
            console.log("Linker error, redirect to default");
            this.GetLink(Link_Special.Default).method(); // SI une erreur a eu lieu, on affiche la page par defaut
        }
    }
}
class App {
    //public static Token : string = "1466c749fd54c9e648ad57a6";
    static Main() {
        View.RootID = "Content";
        /**
         * Affiche l'ensemble des articles présents dans le site
         */
        let showArticles = function () {
            Model.RetrieveArticles(() => {
                new ArticlesView().Show();
            });
        };
        /**
         * Affiche l'ensemble des replays disponibles
         */
        let showReplays = function () {
            Model.RetrieveReplays(() => {
                new ReplaysView().Show();
            });
        };
        /**
         * Affiche un article en particulier (premier élément du tableau params)
         */
        let showArticle = function (params) {
            Model.RetrieveArticles(() => {
                new ArticleFocusView(Model.GetArticle(params[0])).Show();
            });
        };
        /**
         * Affiche le message erreur 500
         */
        let showError500 = function () {
            new Error500View().Show();
        };
        /**
         * Affiche le message erreur 400
         */
        let showError404 = function () {
            new Error404View().Show();
        };
        /**
         * Affiche la page d'index
         */
        let showHome = function () {
            Model.RetrieveArticles(() => {
                Model.RetrieveReplays(() => {
                    new IndexView().Show();
                });
            });
        };
        // Création des liens et des actions associées
        Linker.GetInstance().AddLink("articles", showArticles);
        Linker.GetInstance().AddLink("replays", showReplays);
        Linker.GetInstance().AddLink("article", showArticle);
        Linker.GetInstance().AddLink("index", showHome);
        Linker.GetInstance().AddLink(Link_Special.Error_404, showError404);
        Linker.GetInstance().AddLink(Link_Special.Error_500, showError500);
        Linker.GetInstance().AddLink(Link_Special.Default, showHome);
        Locale.CreateInstance(() => {
            Linker.GetInstance().Analyze(); // Une fois qu'on a chargé la langue on analise l'URL
        });
    }
    static Error(e) {
        if (App.Debug) {
            console.log(e);
            return;
        }
        if (window.location.toString().endsWith(Link_Special.Error_500) == false)
            window.location.replace("Index.html?" + Link_Special.Error_500);
    }
    /**
     * Envoie des requetes Ajax GET
     */
    static Get(url, callback, error) {
        var xhttp = new XMLHttpRequest();
        xhttp.onload = function () {
            callback(xhttp.responseText.trim());
        };
        xhttp.onerror = function () {
            if (error != null)
                error();
        };
        xhttp.open("GET", url + "?token=" + App.Token, true);
        console.log("Processing " + url);
        xhttp.send();
    }
}
App.Debug = true;
App.EndPoint = "http://172.17.0.2/rest/api";
App.Token = "5e33c6d1ec779b9210e9cdad";
window.onload = App.Main;
//# sourceMappingURL=main.js.map