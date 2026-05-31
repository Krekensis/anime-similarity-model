async function fetcha() {
    const res = await fetch(`https://api.jikan.moe/v4/anime?page=15`);
    const json = await res.json();
    console.log(json);
}

fetcha();