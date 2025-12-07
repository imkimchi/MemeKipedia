// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MRC20Token
 * @dev MRC-20 Token for Memecore Network (ERC-20 compatible)
 * Each token represents a unique memecoin tied to a wiki page
 */
contract MRC20Token is ERC20, Ownable {
    string public logoURI;
    string public description;

    event MetadataUpdated(string logoURI, string description);

    /**
     * @dev Constructor to create a new MRC-20 token
     * @param name Token name (from wiki title)
     * @param symbol Token symbol (from wiki slug)
     * @param initialSupply Initial token supply (without decimals)
     * @param _logoURI Token logo URI (from wiki logo)
     * @param _description Token description (from wiki description)
     * @param initialOwner Address that will receive initial supply and ownership
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        string memory _logoURI,
        string memory _description,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        logoURI = _logoURI;
        description = _description;
        _mint(initialOwner, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Update token metadata (only owner)
     * @param _logoURI New logo URI
     * @param _description New description
     */
    function updateMetadata(string memory _logoURI, string memory _description) external onlyOwner {
        logoURI = _logoURI;
        description = _description;
        emit MetadataUpdated(_logoURI, _description);
    }

    /**
     * @dev Mint additional tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (with decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn (with decimals)
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
