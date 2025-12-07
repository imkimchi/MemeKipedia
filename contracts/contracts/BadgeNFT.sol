// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract BadgeNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    mapping(uint256 => string) public badgeTypes;
    mapping(address => uint256[]) public userBadges;

    event BadgeMinted(address indexed to, uint256 indexed tokenId, string badgeType);

    constructor(string memory baseTokenURI) ERC721("Memekipedia Badge", "MBADGE") Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
    }

    function mintBadge(address to, string memory badgeType) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        badgeTypes[tokenId] = badgeType;
        userBadges[to].push(tokenId);

        emit BadgeMinted(to, tokenId, badgeType);
        return tokenId;
    }

    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
