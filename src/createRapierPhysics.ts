import RAPIER from "@dimforge/rapier3d-compat";
import { type GameObjects, type Scene } from "phaser";

type TAddRigidBodyConfig = {
    world: RAPIER.World;
    gameObject: GameObjects.GameObject;
    rigidBodyType: RAPIER.RigidBodyType;
    colliderDesc: RAPIER.ColliderDesc;
};

type TRidgiBodyObject = {
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    gameObject: GameObjects.GameObject;
};

export type TPhysicsObject = {
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    gameObject: GameObjects.GameObject;
};

const addRigidBody = ({
    world,
    gameObject,
    rigidBodyType,
    colliderDesc,
}: TAddRigidBodyConfig): TRidgiBodyObject => {
    // Select the rigid body type
    let rigidBodyDesc: RAPIER.RigidBodyDesc;
    if (rigidBodyType !== undefined) {
        switch (rigidBodyType) {
            case RAPIER.RigidBodyType.Dynamic:
                rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
                break;
            case RAPIER.RigidBodyType.Fixed:
                rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
                break;
            case RAPIER.RigidBodyType.KinematicPositionBased:
                rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
                break;
            case RAPIER.RigidBodyType.KinematicVelocityBased:
                rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
                break;
            default:
                rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
                break;
        }
    } else {
        rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    }

    rigidBodyDesc.setUserData(gameObject);

    const rigidBody = world.createRigidBody(rigidBodyDesc);
    const collider = world.createCollider(colliderDesc, rigidBody);

    // set userData
    return {
        rigidBody,
        collider,
        gameObject,
    };
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

/**
 * Creates a Rapier world and manages its update loop within a Phaser scene.
 * @param {{ x: number, y: number }} gravity - The gravity vector for the Rapier world.
 * @param {Phaser.Scene} scene - The Phaser scene.
 * @returns {Object} An object with methods to interact with the Rapier world.
 */
export const createRapierPhysics = (
    gravity: { x: number; y: number; z: number },
    scene: Scene,
) => {
    let debugEnabled = false;
    let eventQueue: RAPIER.EventQueue | undefined;

    const world = new RAPIER.World(gravity);

    const debugGraphics = scene.add.graphics();
    debugGraphics.setDepth(10000);
    const bodies: Array<{
        rigidBody: RAPIER.RigidBody;
        collider: RAPIER.Collider;
        gameObject: Phaser.GameObjects.GameObject;
    }> = [];

    const update = () => {
        if (eventQueue !== undefined) {
            world.step(eventQueue);
            eventQueue.drainCollisionEvents((event) => {
                console.log(event);
            });
        } else {
            world.step();
        }

        if (debugEnabled) {
            debugGraphics.clear();

            const debugRender = world.debugRender();
            const vertices = debugRender.vertices;
            const colors = debugRender.colors;

            for (let i = 0; i < vertices.length; i += 6) {
                const x1 = vertices[i];
                const y1 = vertices[i + 1];
                const x2 = vertices[i + 2];
                const y2 = vertices[i + 3];
                const z1 = vertices[i + 4];
                const z2 = vertices[i + 5];

                const colorIndex = i * 2;
                const r = colors[colorIndex];
                const g = colors[colorIndex + 1];
                const b = colors[colorIndex + 2];
                const a = colors[colorIndex + 3];

                debugGraphics.lineStyle(
                    2,
                    Phaser.Display.Color.GetColor(r * 255, g * 255, b * 255),
                    a,
                );

                debugGraphics.lineBetween(x1, y1, x2, y2);
            }
        }
    };

    scene.events.on("update", update);

    return {
        /**
         * Get the RAPIER world instance
         * @returns world: RAPIER.World
         */
        getWorld: () => world,
        /**
         * Create a rigid body from a Phaser game object, if in options you set phaserTransformations to true, the position and rotation of the game object will be updated by the physics engine (only available for KinematicPositionBased rigid bodies).
         * - If you set a collider, the collider will be created with the specified shape, otherwise a cuboid will be created with the dimensions of the game object.
         * @param body: Phaser.GameObjects.GameObject
         * @param rapierOptions: { world: RAPIER.World, body: Phaser.GameObjects.GameObject, rigidBodyType?: RAPIER.RigidBodyType, colliderDesc?: RAPIER.ColliderDesc, phaserTransformations?: boolean }
         * @returns rigidBodyObject: { rigidBody: RAPIER.RigidBody, collider: RAPIER.Collider, gameObject: Phaser.GameObjects.GameObject }
         */
        addRigidBody: (
            gameObject: Phaser.GameObjects.GameObject,
            rapierOptions: TRapierOptions,
        ): TPhysicsObject => {
            const _body = addRigidBody({
                world,
                gameObject,
                rigidBodyType: rapierOptions?.rigidBodyType,
                colliderDesc: rapierOptions?.collider,
            });
            bodies.unshift(_body);
            return {
                collider: _body.collider,
                rigidBody: _body.rigidBody,
                gameObject: _body.gameObject,
            };
        },
        /**
         * Enable or disable the debug renderer
         * @param enable: boolean
         */
        debugger: (enable = true) => {
            debugEnabled = enable;
            if (!enable) {
                debugGraphics.clear();
            }
        },

        /**
         * This method destroys a game object and its rigid body, please use this method to destroy the game object and its rigid body, if you destroy the game object directly, the rigid body will not be destroyed and you will have a memory leak.
         * @param gameObject
         */
        destroy: (gameObject: Phaser.GameObjects.GameObject) => {
            const body = bodies.find((
                b: { gameObject: Phaser.GameObjects.GameObject },
            ) => b.gameObject === gameObject);
            if (body?.rigidBody !== undefined) {
                world.removeRigidBody(body.rigidBody);
                body.gameObject.destroy();

                // Remove from bodies array
                const index = bodies.indexOf(body);
                if (index > -1) {
                    bodies.splice(index, 1);
                }
            }
        },
        /**
         * Helps to create a event queue to handle collision events, more info here: https://rapier.rs/docs/user_guides/javascript/advanced_collision_detection_js
         * @returns { eventQueue: RAPIER.EventQueue, free: () => void }
         */
        createEventQueue: () => {
            eventQueue = new RAPIER.EventQueue(true);
            return {
                eventQueue,
                free: () => {
                    if (eventQueue !== undefined) {
                        eventQueue.free();
                        eventQueue = undefined;
                    }
                },
            };
        },
        /**
         * Free the world and remove the update event
         */
        free: () => {
            world.free();
            scene.events.removeListener("update", update);
        },
    };
};

export { RAPIER };
