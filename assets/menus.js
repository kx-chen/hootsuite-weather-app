function bindApiButtons() {
    getSingleElementByClassName('hs_showImagePreview').addEventListener('click', function () {
        hsp.showImagePreview(getSingleElementByClassName('hs_showImagePreviewInput').value, 'https://hootsuite.com');
    });

    getSingleElementByClassName('hs_showLightbox').addEventListener('click', function () {
        // similar to showImagePreview
        hsp.showLightbox(getSingleElementByClassName('hs_showLightboxInput').value);
    });
}

function loadTopBars() {
    var topBarControls = document.getElementsByClassName('hs_topBarControlsBtn');

    Array.prototype.forEach.call(topBarControls, function(topBarControl) {
        topBarControl.addEventListener('click', function (event) {
            var topBarDropdowns = document.getElementsByClassName('hs_topBarDropdown');
            for (var i = 0; i < topBarDropdowns.length; i++) {
                if (event.currentTarget.getAttribute('data-dropdown') === topBarDropdowns[i].getAttribute('data-dropdown')) {
                    if (topBarDropdowns[i].style.display === 'none') {
                        topBarDropdowns[i].style.display = 'block';
                        event.currentTarget.classList.add('active');
                    } else {
                        topBarDropdowns[i].style.display = 'none';
                        event.currentTarget.classList.remove('active');
                    }
                } else {
                    // remove active on all dropdown buttons except the one that was clicked
                    var topBarBtns = document.getElementsByClassName('hs_topBarControlsBtn');
                    for (var p = 0; p < topBarBtns.length; p++) {
                        if (topBarBtns[p].getAttribute('data-dropdown') !== event.currentTarget.getAttribute('data-dropdown')) {
                            topBarBtns[p].classList.remove('active');
                        }
                    }
                    // close all dropdowns except the one that was clicked
                    topBarDropdowns[i].style.display = 'none';
                }
            }
        });
    });
}