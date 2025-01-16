#!/bin/bash

# Convert the files to markdown if that has not already been done
jupyter nbconvert docs/cookbook/*.ipynb --to markdown
