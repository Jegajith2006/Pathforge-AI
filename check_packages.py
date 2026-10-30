import sys
for pkg in ['playwright', 'selenium', 'requests', 'urllib3']:
    try:
        __import__(pkg)
        print(f"{pkg}: available")
    except ImportError:
        print(f"{pkg}: NOT available")

