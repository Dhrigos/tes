// TinyMCE loader for Vite: bundle core + theme + model + plugins in one chunk
// This file is dynamically imported on the client only.

// Core and UI/theme/model
import tinymce from 'tinymce/tinymce';
import 'tinymce/icons/default/icons';
import 'tinymce/themes/silver';
import 'tinymce/models/dom';
// Load UI skin CSS globally (scoped to .tox) so editor uses built-in styles without network fetch
import 'tinymce/skins/ui/oxide/skin.min.css';

// Plugins needed by our editor
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/code';


if (!tinymce) {
    console.error('TinyMCE failed to load globally');
}

export default tinymce;
