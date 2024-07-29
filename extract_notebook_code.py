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
    if len(sys.argv) != 2:
        print("Usage: python extract_notebook_code.py <notebook_path>")
        sys.exit(1)
    
    extract_code_cells(sys.argv[1])
