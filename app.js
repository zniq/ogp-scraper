const cli = require('cheerio-httpcli');

async function main(argv) {
    const args = parseArgs(argv.slice(2));
    if (!args) {
        console.log("args[0]: access uri not found.");
        return;
    }

    const res = await scrape(args);
    console.log(JSON.stringify(res));
};
main(process.argv);

function parseArgs(args) {
    if (!args.length) {
        return null;
    }

    return {
        uri: args[0]
    };
}

async function scrape(args) {
    cli.set('browser', 'chrome');
    const ats = await cli.fetch(args.uri)
        .then(filter)
        .catch(console.error);

    return ats;
}

function filter({error: err, $, response: res, body}) {
    if (err) {
        console.error("fetch error: ", err);
        return null;
    }
    const og = {key: 'og', selector: `meta[property^="og:"]`};
    const fb = {key: 'facebook', selector: `meta[property^="fb:"]`};
    const tw = {key: 'twitter', selector: `meta[property^="twitter:"]`};

    const mapper = (p) => {
        const elms = Array.from($(p.selector).map((i, e) => e.attribs));
        const props = elms.reduce((acc, e) => {
            const a = [e.property.split(':').slice(1).join(':'), e.content];
            return [...acc, a];
        }, []);

        return [p.key, Object.fromEntries(props)];
    };
    const ogmerged = Object.fromEntries([og, fb, tw].map(mapper));

    const title = $('title').text();
    const metadesc = $('meta[name="description"]').attr('content');
    const metakeywords = $('meta[name="keywords"]').attr('content');
    const metas = {
        title: title,
        description: metadesc,
        keywords: metakeywords
    };
    
    return Object.assign({}, ogmerged, metas);
}
