;; The load-path setting is because org-mode's html export needs htmlize.el
;; If this is not an appropriate path, you can set the EMACSLOADPATH environment variable
(setq load-path (cons "~/elisp/org-mode/lisp"
                      (cons "~/elisp/org-mode/contrib/lisp" load-path)))

(require 'org)
;; (require 'ox-html)
;; (require 'ox-latex)

;; building the tutorial generates some figures via latex and tikz
(setq org-latex-to-pdf-process (list "latexmk -pdf %f"))

;; using some prettier colors
(custom-set-faces
 `(font-lock-builtin-face ((t (:foreground "#006FE0"))))
 `(font-lock-comment-delimiter-face ((t (:foreground "#8D8D84")))) ; #696969
 `(font-lock-comment-face ((t (:slant italic :foreground "#8D8D84")))) ; #696969
 `(font-lock-constant-face ((t (:foreground "#8b1a1a")))) ; "#00008b" ; "#D0372D"
 `(font-lock-doc-face ((t (:foreground "#036A07"))))
 `(font-lock-function-name-face ((t (:weight normal :foreground "#006699"))))
 `(font-lock-keyword-face ((t (:bold nil :foreground "#0000FF")))) ; #3654DC
 `(font-lock-preprocessor-face ((t (:foreground "#808080"))))
 `(font-lock-regexp-grouping-backslash ((t (:weight bold :inherit nil))))
 `(font-lock-regexp-grouping-construct ((t (:weight bold :inherit nil))))
 `(font-lock-string-face ((t (:foreground "#008000"))))
 `(font-lock-type-face ((t (:weight normal :foreground "#6434A3"))))
 `(font-lock-variable-name-face ((t (:weight normal :foreground "#BA36A5")))) ; #800080
 `(font-lock-warning-face ((t (:weight bold :foreground "red"))))
 )

(custom-set-variables
 '(org-confirm-babel-evaluate nil)
 '(org-src-preserve-indentation t)
 '(org-babel-use-quick-and-dirty-noweb-expansion t) ;; withoug this, tangling is very slow

 ;; tutorial uses tricks that needs org included
 '(org-babel-load-languages
   (quote
    ((emacs-lisp . t)
     (org . t)
     (latex . t))))

 `(make-backup-files nil)
)

(defun publish-org-to-html (targetpath)
  (let ((fname (car (split-string
                     (car (last (split-string (buffer-file-name) "/"))) "\\.")))
        (org-html-validation-link nil)
        (org-src-fontify-natively t)
        (targetpath (or targetpath ".")))

    (load-theme 'dichromacy)
    
    (org-html-export-as-html)
    
    (write-file (format "%s/%s.html" targetpath fname))))

(defun org-tangle ()
  (let ()
    (org-babel-tangle)))




