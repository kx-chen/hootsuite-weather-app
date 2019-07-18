document.addEventListener('DOMContentLoaded',  () => {
    hsp.init({useTheme: true});
    init();
    loadTopBars();

    hsp.bind('refresh', () => weatherApp.refresh());
    $('[data-toggle="tooltip"]').tooltip();
});
