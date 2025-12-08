import RAPIER from "@dimforge/rapier3d-compat";
import { type GameObjects, type Scene } from "phaser";
export type TPhysicsObject = {
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    gameObject: GameObjects.GameObject;
};
type TRapierOptions = {
    /** The type of rigidbody (Dynamic, Fixed, KinematicPositionBased, KinematicVelocityBased) */
    rigidBodyType: RAPIER.RigidBodyType;
    /**
     * The collider shape, if you pass RAPIER.ColliderDesc.[ball | capsule | cuboid | ...] you need pass the shape size example: RAPIER.ColliderDesc.ball(1.5)
     * - If you don't pass a collider, a cuboid will be created with the dimensions of the game object.
     * - If you pass the type enum RAPIER.ShapeType, the size is created with the dimensions of the object.
     */
    collider: RAPIER.ColliderDesc;
    /** If you pass some KinematicPositionBased then you can use Phaser's transformations. NOTE: Phaser transformations are only available for KinematicPositionBased rigid bodies. Scale is not supported please do it manually  */
    phaserTransformations?: boolean;
};
export type RapierPhysics = {
    getWorld: () => RAPIER.World;
    addRigidBody: (gameObject: Phaser.GameObjects.GameObject, rapierOptions: TRapierOptions) => TPhysicsObject;
    debugger: (enable?: boolean) => void;
    destroy: (gameObject: Phaser.GameObjects.GameObject) => void;
    createEventQueue: () => {
        eventQueue: RAPIER.EventQueue;
        free: () => void;
    };
    free: () => void;
};
/**
 * Creates a Rapier world and manages its update loop within a Phaser scene.
 * @param {{ x: number, y: number }} gravity - The gravity vector for the Rapier world.
 * @param {Phaser.Scene} scene - The Phaser scene.
 * @returns {Object} An object with methods to interact with the Rapier world.
 */
export declare const createRapierPhysics: (gravity: {
    x: number;
    y: number;
    z: number;
}, scene: Scene) => RapierPhysics;
export { RAPIER };
