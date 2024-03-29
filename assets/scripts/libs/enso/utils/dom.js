/**
 * @module DOM Defines functions for DOM manipulation
 */


//// Templating
export const createFragment = html => 
    document.createRange().createContextualFragment(html);

export const createTemplate = html => {
    const template = document.createElement('template');
    template.content.appendChild(createFragment(html));
    return template;
};


//// DOM traversal
export const getChildIndex = (parent, node) => 
    Array.prototype.indexOf.call(parent.childNodes, node);

export const createWalker = (rootNode, nodeTypes, acceptNode) => 
    document.createTreeWalker(rootNode, nodeTypes, { acceptNode });

