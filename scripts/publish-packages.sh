#!/bin/bash

# Publishing helper script for MCP-B packages
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERSION_TYPE="patch"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --major)
      VERSION_TYPE="major"
      shift
      ;;
    --minor)
      VERSION_TYPE="minor"
      shift
      ;;
    --patch)
      VERSION_TYPE="patch"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --major     Bump major version (1.0.0 -> 2.0.0)"
      echo "  --minor     Bump minor version (1.0.0 -> 1.1.0)"
      echo "  --patch     Bump patch version (1.0.0 -> 1.0.1) [default]"
      echo "  --dry-run   Run without actually publishing"
      echo "  --help      Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}MCP-B Package Publishing Script${NC}"
echo "================================="

# Check if npm is authenticated
echo -e "\n${BLUE}Checking npm authentication...${NC}"
if ! npm whoami &> /dev/null; then
  echo -e "${RED}Error: Not authenticated with npm. Please run 'npm login' first.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Authenticated as $(npm whoami)${NC}"

# Check for uncommitted changes
echo -e "\n${BLUE}Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Warning: You have uncommitted changes.${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run checks
echo -e "\n${BLUE}Running pre-publish checks...${NC}"
pnpm check-all
echo -e "${GREEN}✓ All checks passed${NC}"

# Build packages
echo -e "\n${BLUE}Building packages...${NC}"
pnpm build:packages
echo -e "${GREEN}✓ Build complete${NC}"

# Version bump
echo -e "\n${BLUE}Bumping ${VERSION_TYPE} version...${NC}"
pnpm version:${VERSION_TYPE}
echo -e "${GREEN}✓ Version bumped${NC}"

# Show what will be published
echo -e "\n${BLUE}Packages to be published:${NC}"
echo "- @mcp-b/transports"
echo "- @mcp-b/extension-tools"
echo "- @mcp-b/mcp-react-hooks"

if [ "$DRY_RUN" = true ]; then
  echo -e "\n${BLUE}Running dry-run publish...${NC}"
  pnpm publish:dry
  echo -e "\n${GREEN}✓ Dry run complete. No packages were actually published.${NC}"
else
  # Confirm before publishing
  echo -e "\n${RED}Ready to publish to npm!${NC}"
  read -p "Are you sure you want to publish? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}Publishing packages...${NC}"
    pnpm publish:packages
    echo -e "${GREEN}✓ Successfully published all packages!${NC}"
    
    # Commit version changes
    echo -e "\n${BLUE}Committing version changes...${NC}"
    git add packages/*/package.json
    git commit -m "chore: bump package versions to ${VERSION_TYPE}"
    echo -e "${GREEN}✓ Changes committed${NC}"
    
    echo -e "\n${GREEN}Publishing complete!${NC}"
    echo -e "Don't forget to push your changes: ${BLUE}git push${NC}"
  else
    echo -e "${RED}Publishing cancelled.${NC}"
    exit 1
  fi
fi 