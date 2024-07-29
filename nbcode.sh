#!/bin/bash

python3 - << EOF
import json
import sys

def extract_code_cells(notebook_path):
    with open(notebook_path, 'r') as f:
        notebook = json.load(f)
    
    for cell in notebook['cells']:
        if cell['cell_type'] == 'code':
            print(''.join(cell['source']))
            print('\n')  # Add a newline between cells for readability

if __name__ == "__main__":
    extract_code_cells("$1")
EOF
